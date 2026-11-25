import { describe, it, expect } from 'vitest';
import { createRng, nextUint32, rollD6, roll2D6 } from '../../src/engine/rng';

describe('F3.1 – seedelhető RNG', () => {
  it('azonos számbeli seed azonos sorozatot ad', () => {
    let r1 = createRng(12345);
    let r2 = createRng(12345);
    const seq1: number[] = [];
    const seq2: number[] = [];
    for (let i = 0; i < 50; i++) {
      const a = nextUint32(r1);
      const b = nextUint32(r2);
      seq1.push(a.value);
      seq2.push(b.value);
      r1 = a.rng;
      r2 = b.rng;
    }
    expect(seq1).toEqual(seq2);
  });

  it('azonos string seed azonos sorozatot ad, eltérő seed eltérőt', () => {
    const a1 = nextUint32(createRng('csendes-jel-1'));
    const a2 = nextUint32(createRng('csendes-jel-1'));
    const b = nextUint32(createRng('csendes-jel-2'));
    expect(a1.value).toBe(a2.value);
    expect(a1.value).not.toBe(b.value);
  });

  it('tiszta: ugyanazzal az RngState értékkel többször meghívva ugyanazt adja', () => {
    const rng = createRng(42);
    expect(nextUint32(rng)).toEqual(nextUint32(rng));
    expect(rollD6(rng)).toEqual(rollD6(rng));
    expect(roll2D6(rng)).toEqual(roll2D6(rng));
  });
});

describe('F3.2 – d6 és 2d6 dobás', () => {
  it('rollD6 értéke mindig 1 és 6 közötti egész, és minden érték előfordul', () => {
    let rng = createRng(999);
    const counts = new Map<number, number>();
    for (let i = 0; i < 1200; i++) {
      const res = rollD6(rng);
      rng = res.rng;
      expect(Number.isInteger(res.value)).toBe(true);
      expect(res.value).toBeGreaterThanOrEqual(1);
      expect(res.value).toBeLessThanOrEqual(6);
      counts.set(res.value, (counts.get(res.value) ?? 0) + 1);
    }
    expect([...counts.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const c of counts.values()) {
      expect(c).toBeGreaterThan(130);
    }
  });

  it('roll2D6 két 1–6 közötti kockát és azok összegét (2–12) adja, minden összeg előfordul', () => {
    let rng = createRng(2026);
    const totals = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const res = roll2D6(rng);
      rng = res.rng;
      const [d1, d2] = res.dice;
      expect(d1).toBeGreaterThanOrEqual(1);
      expect(d1).toBeLessThanOrEqual(6);
      expect(d2).toBeGreaterThanOrEqual(1);
      expect(d2).toBeLessThanOrEqual(6);
      expect(res.total).toBe(d1 + d2);
      expect(res.total).toBeGreaterThanOrEqual(2);
      expect(res.total).toBeLessThanOrEqual(12);
      totals.add(res.total);
    }
    expect([...totals].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});
