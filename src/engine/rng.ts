import { z } from 'zod';

/** Az RNG belső állapota: 32 bites előjel nélküli egész (0 .. 0xFFFFFFFF). */
export type RngState = number;

export const rngStateSchema = z.number().int().min(0).max(0xffffffff);

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Seedből (számból vagy szövegből) kezdő RngState-et készít. */
export function createRng(seed: number | string): RngState {
  const raw = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
  // Egyetlen SplitMix32 keverő lépés, hogy a közeli számbeli seedek is jól szórjanak
  let z = (raw + 0x9e3779b9) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
  return (z ^ (z >>> 16)) >>> 0;
}

/** Mulberry32 alapú tiszta lépés: visszaad egy 32 bites előjel nélküli egészet és a következő RngState-et. */
export function nextUint32(rng: RngState): { value: number; rng: RngState } {
  const nextState = ((rng >>> 0) + 0x6d2b79f5) >>> 0;
  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = (t ^ (t >>> 14)) >>> 0;
  return { value, rng: nextState };
}

/** Egyetlen hatoldalú kocka dobása (1..6). Tiszta függvény. */
export function rollD6(rng: RngState): { value: number; rng: RngState } {
  const step = nextUint32(rng);
  // 32 bites tartomány egyenletes leképezése 1..6-ra
  const value = Math.floor((step.value / 0x100000000) * 6) + 1;
  return { value, rng: step.rng };
}

/** Két hatoldalú kocka dobása (2d6, összeg 2..12). Tiszta függvény. */
export function roll2D6(rng: RngState): {
  dice: [number, number];
  total: number;
  rng: RngState;
} {
  const first = rollD6(rng);
  const second = rollD6(first.rng);
  return {
    dice: [first.value, second.value],
    total: first.value + second.value,
    rng: second.rng,
  };
}
