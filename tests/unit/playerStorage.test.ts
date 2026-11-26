import { expect, it, vi } from 'vitest';
import { createPlayerStorage } from '../../src/persistence/playerStorage';

it('keeps readable saves and falls back to session memory for blocked writes and deletions', () => {
  const disk = new Map([
    ['existing', 'old save'],
    ['deleted', 'old profile'],
  ]);
  let blocked = false;
  const storage = createPlayerStorage(() => ({
    getItem: (key) => disk.get(key) ?? null,
    setItem(key, value) {
      if (blocked) throw new DOMException('Denied', 'SecurityError');
      disk.set(key, value);
    },
    removeItem(key) {
      if (blocked) throw new DOMException('Denied', 'SecurityError');
      disk.delete(key);
    },
  }));
  const notified = vi.fn();
  storage.subscribe(notified);
  storage.setItem('persistent', 'kept');
  blocked = true;
  storage.setItem('new', 'temporary');
  storage.removeItem('deleted');
  expect(storage.isTemporary()).toBe(true);
  expect(notified).toHaveBeenCalledOnce();
  expect(storage.getItem('existing')).toBe('old save');
  expect(storage.getItem('persistent')).toBe('kept');
  expect(storage.getItem('new')).toBe('temporary');
  expect(storage.getItem('deleted')).toBeNull();
  expect(disk.has('new')).toBe(false);
  expect(disk.has('deleted')).toBe(true);
});
