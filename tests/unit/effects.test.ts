import { describe, it, expect } from 'vitest';
import { applyEffect, applyEffects } from '../../src/engine/effects';
import type { GameState } from '../../src/engine/schema';

const baseState = (): GameState => ({
  heroId: 'dora',
  nodeId: 'n01_start',
  stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
  maxHp: 12,
  items: [],
  flags: {},
  cardUsed: false,
  endingId: null,
});

describe('applyEffect – changeStat', () => {
  it('csökkenti az életerőt', () => {
    const s = applyEffect(baseState(), { type: 'changeStat', stat: 'eletero', delta: -3 });
    expect(s.stats.eletero).toBe(9);
  });

  it('az életerő nem megy 0 alá', () => {
    const s = applyEffect(baseState(), { type: 'changeStat', stat: 'eletero', delta: -50 });
    expect(s.stats.eletero).toBe(0);
  });

  it('az életerő nem megy maxHp fölé', () => {
    const start = { ...baseState(), stats: { ...baseState().stats, eletero: 10 } };
    const s = applyEffect(start, { type: 'changeStat', stat: 'eletero', delta: 5 });
    expect(s.stats.eletero).toBe(12);
  });

  it('a többi stat nem megy 0 alá', () => {
    const s = applyEffect(baseState(), { type: 'changeStat', stat: 'szerencse', delta: -100 });
    expect(s.stats.szerencse).toBe(0);
  });

  it('a többi statnak nincs felső határa', () => {
    const s = applyEffect(baseState(), { type: 'changeStat', stat: 'technika', delta: 5 });
    expect(s.stats.technika).toBe(15);
  });

  it('csak a megadott statot módosítja', () => {
    const s = applyEffect(baseState(), { type: 'changeStat', stat: 'reflex', delta: 1 });
    expect(s.stats).toEqual({ reflex: 8, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 });
  });
});

describe('applyEffect – tárgyak', () => {
  it('addItem hozzáadja a tárgyat', () => {
    const s = applyEffect(baseState(), { type: 'addItem', itemId: 'hopatron' });
    expect(s.items).toEqual(['hopatron']);
  });

  it('addItem meglévő tárgyra nem duplikál', () => {
    const once = applyEffect(baseState(), { type: 'addItem', itemId: 'hopatron' });
    const twice = applyEffect(once, { type: 'addItem', itemId: 'hopatron' });
    expect(twice.items).toEqual(['hopatron']);
  });

  it('removeItem eltávolítja a tárgyat', () => {
    const withItem = applyEffect(baseState(), { type: 'addItem', itemId: 'hopatron' });
    const s = applyEffect(withItem, { type: 'removeItem', itemId: 'hopatron' });
    expect(s.items).toEqual([]);
  });

  it('removeItem hiányzó tárgyra nem csinál semmit', () => {
    const s = applyEffect(baseState(), { type: 'removeItem', itemId: 'nincs' });
    expect(s.items).toEqual([]);
  });
});

describe('applyEffect – setFlag', () => {
  it('alapértelmezetten true-ra állít', () => {
    expect(applyEffect(baseState(), { type: 'setFlag', flag: 'ment' }).flags).toEqual({
      ment: true,
    });
  });

  it('explicit false-t is beállít', () => {
    const s = applyEffect(baseState(), { type: 'setFlag', flag: 'ment', value: false });
    expect(s.flags).toEqual({ ment: false });
  });

  it('felülírja a korábbi értéket', () => {
    const a = applyEffect(baseState(), { type: 'setFlag', flag: 'ment' });
    const b = applyEffect(a, { type: 'setFlag', flag: 'ment', value: false });
    expect(b.flags.ment).toBe(false);
  });
});

describe('purity', () => {
  it('a bemeneti állapot nem változik', () => {
    const s = baseState();
    const copy = structuredClone(s);
    applyEffect(s, { type: 'changeStat', stat: 'eletero', delta: -3 });
    applyEffect(s, { type: 'addItem', itemId: 'x' });
    applyEffect(s, { type: 'setFlag', flag: 'f' });
    expect(s).toEqual(copy);
  });

  it('új objektumot ad vissza', () => {
    const s = baseState();
    expect(applyEffect(s, { type: 'setFlag', flag: 'f' })).not.toBe(s);
  });
});

describe('applyEffects', () => {
  it('sorrendben alkalmazza az effekteket', () => {
    const s = applyEffects(baseState(), [
      { type: 'changeStat', stat: 'eletero', delta: -5 },
      { type: 'changeStat', stat: 'eletero', delta: 3 },
      { type: 'addItem', itemId: 'hopatron' },
      { type: 'setFlag', flag: 'ment' },
    ]);
    expect(s.stats.eletero).toBe(10);
    expect(s.items).toEqual(['hopatron']);
    expect(s.flags).toEqual({ ment: true });
  });

  it('a sorrend számít a korlátozásnál (előbb sebzés, aztán gyógyítás)', () => {
    const s = applyEffects(baseState(), [
      { type: 'changeStat', stat: 'eletero', delta: 5 },
      { type: 'changeStat', stat: 'eletero', delta: -3 },
    ]);
    expect(s.stats.eletero).toBe(9);
  });

  it('üres listára ugyanazt az értéket adja', () => {
    const s = baseState();
    expect(applyEffects(s, [])).toEqual(s);
  });
});
