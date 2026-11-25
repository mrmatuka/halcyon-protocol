import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  getAvailableChoices,
  applyChoice,
  useHealCard,
  canUseCardOnChoice,
} from '../../src/engine/engine';
import { createRng, roll2D6 } from '../../src/engine/rng';
import { sampleHeroes, sampleItems, sampleStory } from '../fixtures/sampleContent';
import type { Content } from '../../src/engine/validate';
import type { Hero } from '../../src/engine/schema';

const liliHero: Hero = {
  id: 'lili',
  name: 'Dr. Imre Lili',
  role: 'Orvos',
  description: '',
  stats: { reflex: 8, technika: 8, kitartas: 7, szerencse: 10, eletero: 12 },
  card: {
    id: 'stimulator',
    name: 'Stimulátor',
    description: '',
    options: [
      { type: 'heal', amount: 5 },
      { type: 'autoSuccess', stats: ['technika'], choiceIds: ['c_bemegy'] },
    ],
  },
};

const content: Content = {
  heroes: [...sampleHeroes, liliHero],
  items: sampleItems,
  story: sampleStory,
};

function findSeedForTotal(predicate: (total: number) => boolean): number {
  for (let s = 1; s < 10000; s++) {
    if (predicate(roll2D6(createRng(s)).total)) return s;
  }
  throw new Error('Nem található seed');
}

describe('F3.5 – createInitialState és getAvailableChoices', () => {
  it('létrehozza a kezdőállapotot a hős kezdőértékeivel', () => {
    const state = createInitialState(content, 'dora');
    expect(state.heroId).toBe('dora');
    expect(state.nodeId).toBe('n01_start');
    expect(state.maxHp).toBe(12);
    expect(state.stats.eletero).toBe(12);
    expect(state.endingId).toBeNull();
  });

  it('elrejti a nem teljesülő feltételű választást, és megjeleníti, ha teljesül', () => {
    const s1 = { ...createInitialState(content, 'dora'), nodeId: 'n02_zarlat' };
    expect(getAvailableChoices(content, s1).map((c) => c.id)).toEqual(['c_fut']);

    const s2 = { ...s1, items: ['kartya'] };
    expect(getAvailableChoices(content, s2).map((c) => c.id)).toEqual(['c_fut', 'c_kartya']);
  });

  it('befejező csomóponton üres listát ad', () => {
    const s = { ...createInitialState(content, 'dora'), nodeId: 'e1_siker', endingId: 'e1_siker' };
    expect(getAvailableChoices(content, s)).toEqual([]);
  });
});

describe('F3.6 – applyChoice (tiszta függvény)', () => {
  it('egyszerű választás: alkalmazza az effekteket, átlép a célra, nem fogyaszt RNG-t', () => {
    const s0 = createInitialState(content, 'dora');
    const copy = structuredClone(s0);
    const rng = createRng(10);
    const res = applyChoice(content, s0, 'c_bemegy', rng);

    expect(s0).toEqual(copy); // bemenet nem mutálódott
    expect(res.state.nodeId).toBe('n02_zarlat');
    expect(res.state.items).toEqual(['hopatron']);
    expect(res.checkResult).toBeNull();
    expect(res.rng).toBe(rng);
  });

  it('próbás választás sikeres ága: célra ugrik, befejezést detektál és visszaadja a CheckResult-ot', () => {
    const s0 = createInitialState(content, 'dora');
    const s1 = applyChoice(content, s0, 'c_bemegy', createRng(1)).state;
    // s1-ben van hopatron (+1 reflex az n02_zarlat-ban -> célszám 7 + 1 = 8)
    const seed = findSeedForTotal((t) => t === 8);
    const res = applyChoice(content, s1, 'c_fut', createRng(seed));

    expect(res.checkResult).not.toBeNull();
    expect(res.checkResult!.target).toBe(8);
    expect(res.checkResult!.success).toBe(true);
    expect(res.state.flags.ment).toBe(true);
    expect(res.state.nodeId).toBe('e1_siker');
    expect(res.state.endingId).toBe('e1_siker');
  });

  it('próbás választás sikertelen ága: levonja az életerőt és a failure.target-re lép', () => {
    const s0 = createInitialState(content, 'dora');
    const s1 = applyChoice(content, s0, 'c_bemegy', createRng(1)).state;
    const seed = findSeedForTotal((t) => t === 11);
    const res = applyChoice(content, s1, 'c_fut', createRng(seed));

    expect(res.checkResult!.success).toBe(false);
    expect(res.state.stats.eletero).toBe(9);
    expect(res.state.nodeId).toBe('d2_vakuum');
    expect(res.state.endingId).toBe('d2_vakuum');
  });

  it('elutasítja a rejtett (nem teljesülő feltételű) vagy nem létező választást', () => {
    const s = { ...createInitialState(content, 'dora'), nodeId: 'n02_zarlat' };
    expect(() => applyChoice(content, s, 'c_kartya', createRng(1))).toThrow();
    expect(() => applyChoice(content, s, 'nincs_ilyen', createRng(1))).toThrow();
  });

  it('useHealCard gyógyít a maximumig és elhasználja a kártyát', () => {
    const s0 = {
      ...createInitialState(content, 'lili'),
      stats: { reflex: 8, technika: 8, kitartas: 7, szerencse: 10, eletero: 9 },
    };
    const s1 = useHealCard(content, s0);
    expect(s1.stats.eletero).toBe(12);
    expect(s1.cardUsed).toBe(true);
    expect(() => useHealCard(content, s1)).toThrow();
  });

  it('canUseCardOnChoice ellenőrzi a choiceIds megszorítást', () => {
    const s = { ...createInitialState(content, 'lili'), nodeId: 'n02_zarlat' };
    expect(canUseCardOnChoice(content, s, 'c_fut')).toBe(false);
  });
});

describe('F3.7 – életerő 0 kezelése és befejezés-detektálás', () => {
  it('ha az életerő 0-ra csökken, a motor a deathEndingId (d1_kihules) csomópontra irányít', () => {
    const s = {
      ...createInitialState(content, 'dora'),
      nodeId: 'n02_zarlat',
      stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 2 },
    };
    const seed = findSeedForTotal((t) => t === 12);
    const res = applyChoice(content, s, 'c_fut', createRng(seed));

    expect(res.state.stats.eletero).toBe(0);
    expect(res.state.nodeId).toBe('d1_kihules');
    expect(res.state.endingId).toBe('d1_kihules');
  });

  it('befejezett játékban nem enged újabb választást', () => {
    const s = {
      ...createInitialState(content, 'dora'),
      nodeId: 'e1_siker',
      endingId: 'e1_siker',
    };
    expect(() => applyChoice(content, s, 'c_bemegy', createRng(1))).toThrow();
  });
});
