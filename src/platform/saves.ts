import { playerStorage, type KeyValueStorage } from '../persistence/playerStorage';
import { LocalStorageSaveRepository } from '../persistence/localStorageSaveRepository';
import { ALL_SLOT_IDS } from '../persistence/saveRepository';

const legacyPrefix = 'kalandjatek:save:';
const migrated = 'kalandjatek:migrated:csendes-jel';

export function adventureSaves(id: string, storage: KeyValueStorage = playerStorage) {
  return new LocalStorageSaveRepository(storage, { keyPrefix: `kalandjatek:adventure:${id}:` });
}

export function migrateSilentSignalSaves(storage: KeyValueStorage = playerStorage): void {
  if (storage.getItem(migrated)) return;
  for (const slot of ALL_SLOT_IDS) {
    const source = storage.getItem(legacyPrefix + slot);
    const target = `kalandjatek:adventure:csendes-jel:${slot}`;
    if (source !== null && storage.getItem(target) === null) storage.setItem(target, source);
  }
  storage.setItem(migrated, '1');
}
