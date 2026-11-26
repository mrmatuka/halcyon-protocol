export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function createPlayerStorage(open: () => KeyValueStorage = () => globalThis.localStorage) {
  // Null entries mask persistent keys deleted while storage is unavailable.
  const cached = new Map<string, string | null>();
  const overlay = new Map<string, string | null>();
  const listeners = new Set<() => void>();
  let temporary = false;

  function markTemporary() {
    if (temporary) return;
    temporary = true;
    listeners.forEach((listener) => listener());
  }

  function write(key: string, value: string | null) {
    try {
      const storage = open();
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
      overlay.delete(key);
      cached.set(key, value);
    } catch {
      overlay.set(key, value);
      markTemporary();
    }
  }

  return {
    getItem(key: string): string | null {
      if (overlay.has(key)) return overlay.get(key) ?? null;
      try {
        const value = open().getItem(key);
        cached.set(key, value);
        return value;
      } catch {
        markTemporary();
        return cached.get(key) ?? null;
      }
    },
    setItem(key: string, value: string) {
      write(key, value);
    },
    removeItem(key: string) {
      write(key, null);
    },
    isTemporary: () => temporary,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const playerStorage = createPlayerStorage();
