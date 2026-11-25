import { describe, it, expect } from 'vitest';
import { computeModifier, performCheck } from '../../src/engine/checks';
import { createRng, roll2D6 } from '../../src/engine/rng';
import type { GameState, Hero, Item } from '../../src/engine/schema';

const makeState = (overrides?: Partial<GameState>): GameState => ({
  heroId: 'dora',
  nodeId: 'n14_zarlat',
  stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
  maxHp: 12,
  items: [],
  flags: {},
  cardUsed: false,
  endingId: null,
  ...overrides,
});

const items: Item[] = [
  {
    id: 'hopatron',
    name: 'Hőpatron',
    description: '+1 Reflex az N14-ben',
    modifiers: [{ stat: 'reflex', delta: 1, nodeId: 'n14_zarlat' }],
  },
  {
    id: 'szerszam',
    name: 'Szerszám',
    description: '+2 Technika bárhol',
    modifiers: [{ stat: 'technika', delta: 2 }],
  },
];

const doraHero: Hero = {
  id: 'dora',
  name: 'Vass Dóra',
  role: 'Mérnök',
  description: '',
  stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
  card: {
    id: 'rovidzar',
    name: 'Rövidzár',
    description: '',
    options: [{ type: 'autoSuccess', stats: ['technika'] }],
  },
};

const benceHero: Hero = {
  id: 'bence',
  name: 'Kő Bence',
  role: 'Biztonsági tiszt',
  description: '',
  stats: { reflex: 9, technika: 6, kitartas: 10, szerencse: 7, eletero: 16 },
  card: {
    id: 'adrenalin',
    name: 'Adrenalin',
    description: '',
    options: [{ type: 'reroll', stats: ['reflex', 'kitartas'] }],
  },
};

// Segédfüggvény: olyan seedet keres, amelyen az első 2d6 dobás a kívánt összeget adja
function findSeedForRoll(predicate: (first: number, second: number) => boolean): number {
  for (let s = 1; s < 50000; s++) {
    const r1 = roll2D6(createRng(s));
    const r2 = roll2D6(r1.rng);
    if (predicate(r1.total, r2.total)) return s;
  }
  throw new Error('Nem található megfelelő seed');
}

describe('F3.3 – computeModifier és 2d6 <= tulajdonság + módosító', () => {
  it('módosító 0, ha a tárgy nincs a játékosnál', () => {
    expect(computeModifier(makeState(), items, 'reflex')).toBe(0);
  });

  it('módosító érvényesül az adott csomóponton és globálisan is', () => {
    const s = makeState({ items: ['hopatron', 'szerszam'] });
    expect(computeModifier(s, items, 'reflex')).toBe(1);
    expect(computeModifier(s, items, 'technika')).toBe(2);
  });

  it('csomóponthoz kötött módosító más csomóponton nem érvényesül', () => {
    const s = makeState({ nodeId: 'n01_start', items: ['hopatron'] });
    expect(computeModifier(s, items, 'reflex')).toBe(0);
  });

  it('egyenlőségnél (2d6 == célszám) a próba SIKERES', () => {
    const seed = findSeedForRoll((first) => first === 7);
    const { checkResult } = performCheck({
      state: makeState(),
      hero: doraHero,
      items,
      stat: 'reflex',
      choiceId: 'c1',
      rng: createRng(seed),
    });
    expect(checkResult.total).toBe(7);
    expect(checkResult.target).toBe(7);
    expect(checkResult.success).toBe(true);
  });

  it('célszámnál 1-gyel nagyobb dobásnál (2d6 > célszám) SIKERTELEN', () => {
    const seed = findSeedForRoll((first) => first === 8);
    const { checkResult } = performCheck({
      state: makeState(),
      hero: doraHero,
      items,
      stat: 'reflex',
      choiceId: 'c1',
      rng: createRng(seed),
    });
    expect(checkResult.total).toBe(8);
    expect(checkResult.target).toBe(7);
    expect(checkResult.success).toBe(false);
  });

  it('Hőpatron +1 módosítóval a 8-as dobás 7-es alap Reflex mellett SIKERES', () => {
    const seed = findSeedForRoll((first) => first === 8);
    const { checkResult } = performCheck({
      state: makeState({ items: ['hopatron'] }),
      hero: doraHero,
      items,
      stat: 'reflex',
      choiceId: 'c1',
      rng: createRng(seed),
    });
    expect(checkResult.baseStat).toBe(7);
    expect(checkResult.modifier).toBe(1);
    expect(checkResult.target).toBe(8);
    expect(checkResult.total).toBe(8);
    expect(checkResult.success).toBe(true);
  });

  it('határeset: célszám < 2 mindig sikertelen, célszám >= 12 mindig sikeres', () => {
    let rng = createRng(77);
    for (let i = 0; i < 50; i++) {
      const low = performCheck({
        state: makeState({
          stats: { reflex: 1, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
        }),
        hero: doraHero,
        items,
        stat: 'reflex',
        choiceId: 'c1',
        rng,
      });
      expect(low.checkResult.success).toBe(false);

      const high = performCheck({
        state: makeState({
          stats: { reflex: 12, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
        }),
        hero: doraHero,
        items,
        stat: 'reflex',
        choiceId: 'c1',
        rng,
      });
      expect(high.checkResult.success).toBe(true);
      rng = high.rng;
    }
  });
});

describe('F3.3 – képességkártyák próbánál (autoSuccess és reroll)', () => {
  it('autoSuccess kártya dobás nélkül nyer és elhasználja a kártyát', () => {
    const rng = createRng(123);
    const res = performCheck({
      state: makeState(),
      hero: doraHero,
      items,
      stat: 'technika',
      choiceId: 'c_tech',
      rng,
      useCard: true,
    });
    expect(res.checkResult.success).toBe(true);
    expect(res.checkResult.cardUsed).toBe('autoSuccess');
    expect(res.state.cardUsed).toBe(true);
    expect(res.rng).toBe(rng); // nem fogyaszt RNG-t
  });

  it('reroll kártya: ha az első dobás sikeres, a kártya NEM fogy el', () => {
    const seed = findSeedForRoll((first) => first <= 9);
    const res = performCheck({
      state: makeState({
        heroId: 'bence',
        stats: { reflex: 9, technika: 6, kitartas: 10, szerencse: 7, eletero: 16 },
      }),
      hero: benceHero,
      items,
      stat: 'reflex',
      choiceId: 'c_ref',
      rng: createRng(seed),
      useCard: true,
    });
    expect(res.checkResult.success).toBe(true);
    expect(res.checkResult.cardUsed).toBeNull();
    expect(res.checkResult.rerolledFrom).toBeNull();
    expect(res.state.cardUsed).toBe(false);
  });

  it('reroll kártya: ha az első dobás sikertelen, újradob és elhasználja a kártyát', () => {
    const seed = findSeedForRoll((first, second) => first > 9 && second <= 9);
    const res = performCheck({
      state: makeState({
        heroId: 'bence',
        stats: { reflex: 9, technika: 6, kitartas: 10, szerencse: 7, eletero: 16 },
      }),
      hero: benceHero,
      items,
      stat: 'reflex',
      choiceId: 'c_ref',
      rng: createRng(seed),
      useCard: true,
    });
    expect(res.checkResult.success).toBe(true);
    expect(res.checkResult.cardUsed).toBe('reroll');
    expect(res.checkResult.rerolledFrom).not.toBeNull();
    expect(res.checkResult.rerolledFrom!.total).toBeGreaterThan(9);
    expect(res.state.cardUsed).toBe(true);
  });

  it('hibát dob, ha már elhasznált vagy nem illeszkedő kártyát próbál használni', () => {
    expect(() =>
      performCheck({
        state: makeState({ cardUsed: true }),
        hero: doraHero,
        items,
        stat: 'technika',
        choiceId: 'c_tech',
        rng: createRng(1),
        useCard: true,
      }),
    ).toThrow();

    expect(() =>
      performCheck({
        state: makeState(),
        hero: doraHero,
        items,
        stat: 'reflex', // Dóra kártyája csak technikára jó
        choiceId: 'c_ref',
        rng: createRng(1),
        useCard: true,
      }),
    ).toThrow();
  });
});

describe('F3.4 – Szerencse-próba és fogyása', () => {
  it('sikeres Szerencse-próba után a Szerencse 1-gyel csökken, a próba az eredeti értékkel számol', () => {
    const seed = findSeedForRoll((first) => first === 8);
    const res = performCheck({
      state: makeState({
        stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
      }),
      hero: doraHero,
      items,
      stat: 'szerencse',
      choiceId: 'c_luck',
      rng: createRng(seed),
    });
    expect(res.checkResult.target).toBe(8);
    expect(res.checkResult.success).toBe(true);
    expect(res.state.stats.szerencse).toBe(7);
  });

  it('sikertelen Szerencse-próba után is 1-gyel csökken a Szerencse', () => {
    const seed = findSeedForRoll((first) => first === 11);
    const res = performCheck({
      state: makeState({
        stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
      }),
      hero: doraHero,
      items,
      stat: 'szerencse',
      choiceId: 'c_luck',
      rng: createRng(seed),
    });
    expect(res.checkResult.success).toBe(false);
    expect(res.state.stats.szerencse).toBe(7);
  });

  it('0-s Szerencse nem csökken 0 alá', () => {
    const res = performCheck({
      state: makeState({
        stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 0, eletero: 12 },
      }),
      hero: doraHero,
      items,
      stat: 'szerencse',
      choiceId: 'c_luck',
      rng: createRng(1),
    });
    expect(res.checkResult.success).toBe(false);
    expect(res.state.stats.szerencse).toBe(0);
  });
});
