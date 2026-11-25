import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../../src/engine/conditions';
import type { Condition, GameState } from '../../src/engine/schema';

const baseState = (): GameState => ({
  heroId: 'dora',
  nodeId: 'n01_start',
  stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
  maxHp: 12,
  items: ['kartya'],
  flags: { mara_lie: true, ment: false },
  cardUsed: false,
  endingId: null,
});

describe('evaluateCondition', () => {
  const state = baseState();

  it('hasItem', () => {
    expect(evaluateCondition({ type: 'hasItem', itemId: 'kartya' }, state)).toBe(true);
    expect(evaluateCondition({ type: 'hasItem', itemId: 'hopatron' }, state)).toBe(false);
  });

  it('flag: alapértelmezett érték true', () => {
    expect(evaluateCondition({ type: 'flag', flag: 'mara_lie' }, state)).toBe(true);
    expect(evaluateCondition({ type: 'flag', flag: 'ment' }, state)).toBe(false);
  });

  it('flag: a be nem állított flag hamis', () => {
    expect(evaluateCondition({ type: 'flag', flag: 'ismeretlen' }, state)).toBe(false);
  });

  it('flag: explicit value=false az igaz, ha a flag hamis vagy hiányzik', () => {
    expect(evaluateCondition({ type: 'flag', flag: 'ment', value: false }, state)).toBe(true);
    expect(evaluateCondition({ type: 'flag', flag: 'ismeretlen', value: false }, state)).toBe(true);
    expect(evaluateCondition({ type: 'flag', flag: 'mara_lie', value: false }, state)).toBe(false);
  });

  it('statAtLeast: egyenlőségnél igaz', () => {
    expect(evaluateCondition({ type: 'statAtLeast', stat: 'reflex', value: 7 }, state)).toBe(true);
    expect(evaluateCondition({ type: 'statAtLeast', stat: 'reflex', value: 8 }, state)).toBe(false);
    expect(evaluateCondition({ type: 'statAtLeast', stat: 'eletero', value: 12 }, state)).toBe(
      true,
    );
  });

  it('all / any / not', () => {
    const yes: Condition = { type: 'hasItem', itemId: 'kartya' };
    const no: Condition = { type: 'hasItem', itemId: 'hopatron' };
    expect(evaluateCondition({ type: 'all', conditions: [yes, yes] }, state)).toBe(true);
    expect(evaluateCondition({ type: 'all', conditions: [yes, no] }, state)).toBe(false);
    expect(evaluateCondition({ type: 'any', conditions: [no, yes] }, state)).toBe(true);
    expect(evaluateCondition({ type: 'any', conditions: [no, no] }, state)).toBe(false);
    expect(evaluateCondition({ type: 'not', condition: no }, state)).toBe(true);
    expect(evaluateCondition({ type: 'not', condition: yes }, state)).toBe(false);
  });

  it('beágyazott feltétel (N10 mintájára: bármelyik flag)', () => {
    const cond: Condition = {
      type: 'any',
      conditions: [
        { type: 'flag', flag: 'log_hajnal' },
        { type: 'flag', flag: 'signal_truth' },
        { type: 'flag', flag: 'mara_lie' },
      ],
    };
    expect(evaluateCondition(cond, state)).toBe(true);
  });

  it('nem módosítja az állapotot', () => {
    const s = baseState();
    const copy = structuredClone(s);
    evaluateCondition({ type: 'hasItem', itemId: 'kartya' }, s);
    expect(s).toEqual(copy);
  });
});
