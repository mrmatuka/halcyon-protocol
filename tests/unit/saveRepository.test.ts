import { describe, it, expect, beforeEach } from 'vitest';
import {
  ALL_SLOT_IDS,
  AUTOSAVE_SLOT_ID,
  MANUAL_SLOT_IDS,
  SaveError,
  type SaveRepository,
} from '../../src/persistence/saveRepository';
import { LocalStorageSaveRepository } from '../../src/persistence/localStorageSaveRepository';
import { createInitialState, applyChoice } from '../../src/engine/engine';
import { createRng, roll2D6 } from '../../src/engine/rng';
import { SAVE_FORMAT_VERSION } from '../../src/engine/serialization';
import { sampleHeroes, sampleItems, sampleStory } from '../fixtures/sampleContent';

const content = { heroes: sampleHeroes, items: sampleItems, story: sampleStory };

function createMemoryStorage(options?: { throwOnSet?: Error }): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      if (options?.throwOnSet) throw options.throwOnSet;
      map.set(key, value);
    },
  };
}

describe('F4.2–F4.3 – SaveRepository és LocalStorageSaveRepository', () => {
  let storage: Storage;
  let repo: SaveRepository;
  let now: string;

  beforeEach(() => {
    storage = createMemoryStorage();
    now = '2026-11-25T22:15:00.000Z';
    repo = new LocalStorageSaveRepository(storage, { now: () => now });
  });

  it('3 kézi slot és 1 automentés slot létezik', () => {
    expect(MANUAL_SLOT_IDS).toEqual(['slot1', 'slot2', 'slot3']);
    expect(AUTOSAVE_SLOT_ID).toBe('autosave');
    expect(ALL_SLOT_IDS).toEqual(['autosave', 'slot1', 'slot2', 'slot3']);
  });

  it('üres tárolónál minden slot üresként jelenik meg a listában', async () => {
    const slots = await repo.listSlots();
    expect(slots).toEqual([
      { slotId: 'autosave', status: 'empty' },
      { slotId: 'slot1', status: 'empty' },
      { slotId: 'slot2', status: 'empty' },
      { slotId: 'slot3', status: 'empty' },
    ]);
  });

  it('mentés, betöltés és slotlista metaadatokkal (időbélyeg, csomópont címe, hős neve)', async () => {
    const state = createInitialState(content, 'dora');
    const rng = createRng(1234);

    const savedMeta = await repo.save('slot1', state, rng, {
      nodeTitle: 'Kezdet',
      heroName: 'Vass Dóra',
    });

    expect(savedMeta).toEqual({
      slotId: 'slot1',
      savedAt: '2026-11-25T22:15:00.000Z',
      nodeTitle: 'Kezdet',
      heroName: 'Vass Dóra',
    });

    const loaded = await repo.load('slot1');
    expect(loaded.state).toEqual(state);
    expect(loaded.rng).toBe(rng);
    expect(loaded.metadata).toEqual(savedMeta);

    const slots = await repo.listSlots();
    expect(slots.find((s) => s.slotId === 'slot1')).toEqual({
      slotId: 'slot1',
      status: 'ok',
      metadata: savedMeta,
    });
    expect(slots.find((s) => s.slotId === 'slot2')).toEqual({
      slotId: 'slot2',
      status: 'empty',
    });
  });

  it('a slotok függetlenek egymástól, és a törlés csak az adott slotot érinti', async () => {
    const s0 = createInitialState(content, 'dora');
    const step1 = applyChoice(content, s0, 'c_bemegy', createRng(55));

    await repo.save('slot1', s0, createRng(1), { nodeTitle: 'Kezdet', heroName: 'Vass Dóra' });
    await repo.save('autosave', step1.state, step1.rng, {
      nodeTitle: 'Zárlat',
      heroName: 'Vass Dóra',
    });

    await repo.delete('slot1');

    const slots = await repo.listSlots();
    expect(slots.find((s) => s.slotId === 'slot1')?.status).toBe('empty');
    expect(slots.find((s) => s.slotId === 'autosave')?.status).toBe('ok');

    // Üres slot törlése nem dob hibát
    await expect(repo.delete('slot1')).resolves.toBeUndefined();
  });
});

describe('F4.4 – sérült, ismeretlen verziójú mentés és megtelt tároló', () => {
  it('üres slot betöltése NOT_FOUND hibát dob', async () => {
    const repo = new LocalStorageSaveRepository(createMemoryStorage());
    await expect(repo.load('slot2')).rejects.toMatchObject({
      name: 'SaveError',
      code: 'NOT_FOUND',
    });
  });

  it('sérült JSON esetén a listSlots corrupted státuszt ad (nem omlik össze), a load CORRUPTED hibát dob', async () => {
    const storage = createMemoryStorage();
    storage.setItem('kalandjatek:save:slot1', '{nem ervenyes json');
    const repo = new LocalStorageSaveRepository(storage);

    const slots = await repo.listSlots();
    const slot1 = slots.find((s) => s.slotId === 'slot1');
    expect(slot1?.status).toBe('corrupted');

    await expect(repo.load('slot1')).rejects.toSatisfy(
      (err: unknown) => err instanceof SaveError && err.code === 'CORRUPTED',
    );
  });

  it('ismeretlen mentési verziónál a load UNSUPPORTED_VERSION hibát dob, a listSlots corrupted-et jelez', async () => {
    const storage = createMemoryStorage();
    const state = createInitialState(content, 'dora');
    storage.setItem(
      'kalandjatek:save:slot3',
      JSON.stringify({
        metadata: {
          savedAt: '2026-11-25T22:15:00.000Z',
          nodeTitle: 'Kezdet',
          heroName: 'Vass Dóra',
        },
        payload: JSON.stringify({
          version: SAVE_FORMAT_VERSION + 99,
          state,
          rng: 42,
        }),
      }),
    );
    const repo = new LocalStorageSaveRepository(storage);

    const slots = await repo.listSlots();
    expect(slots.find((s) => s.slotId === 'slot3')?.status).toBe('corrupted');

    await expect(repo.load('slot3')).rejects.toSatisfy(
      (err: unknown) => err instanceof SaveError && err.code === 'UNSUPPORTED_VERSION',
    );
  });

  it('megtelt tároló (QuotaExceededError) esetén QUOTA_EXCEEDED hibát dob', async () => {
    const quotaErr = new DOMException('Quota exceeded', 'QuotaExceededError');
    const storage = createMemoryStorage({ throwOnSet: quotaErr });
    const repo = new LocalStorageSaveRepository(storage);
    const state = createInitialState(content, 'dora');

    await expect(
      repo.save('slot1', state, createRng(1), { nodeTitle: 'Kezdet', heroName: 'Vass Dóra' }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof SaveError && err.code === 'QUOTA_EXCEEDED',
    );
  });
});

describe('F4.5 – mentés és betöltés után azonos állapot és azonos következő dobások', () => {
  it('a betöltött játékból pontosan ugyanazok a dobások és végállapot következnek', async () => {
    const repo = new LocalStorageSaveRepository(createMemoryStorage());

    const s0 = createInitialState(content, 'dora');
    const step1 = applyChoice(content, s0, 'c_bemegy', createRng(2026));

    await repo.save('slot1', step1.state, step1.rng, {
      nodeTitle: 'Zárlat',
      heroName: 'Vass Dóra',
    });

    const loaded = await repo.load('slot1');
    expect(loaded.state).toEqual(step1.state);
    expect(roll2D6(loaded.rng)).toEqual(roll2D6(step1.rng));

    const directStep2 = applyChoice(content, step1.state, 'c_fut', step1.rng);
    const loadedStep2 = applyChoice(content, loaded.state, 'c_fut', loaded.rng);

    expect(loadedStep2).toEqual(directStep2);
  });
});
