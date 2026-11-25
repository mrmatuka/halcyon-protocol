import { describe, it, expect } from 'vitest';
import {
  SAVE_FORMAT_VERSION,
  serializeGame,
  deserializeGame,
} from '../../src/engine/serialization';
import { createInitialState } from '../../src/engine/engine';
import { createRng, roll2D6 } from '../../src/engine/rng';
import { sampleHeroes, sampleItems, sampleStory } from '../fixtures/sampleContent';

const content = { heroes: sampleHeroes, items: sampleItems, story: sampleStory };

describe('F3.8 – játékállás szerializálás és deszerializálás', () => {
  it('tartalmazza a verziómezőt, az állapotot és az RNG-állapotot, és visszaállítva azonos', () => {
    const state = createInitialState(content, 'dora');
    const rng = createRng(98765);
    const json = serializeGame(state, rng);
    const raw = JSON.parse(json);

    expect(raw.version).toBe(SAVE_FORMAT_VERSION);
    const restored = deserializeGame(json);
    expect(restored.state).toEqual(state);
    expect(restored.rng).toBe(rng);
    expect(roll2D6(restored.rng)).toEqual(roll2D6(rng));
  });

  it('elutasítja a hibás JSON-t', () => {
    expect(() => deserializeGame('{hibas')).toThrow();
  });

  it('elutasítja az ismeretlen verziószámot', () => {
    const state = createInitialState(content, 'dora');
    const bad = JSON.stringify({ version: 999, state, rng: 1 });
    expect(() => deserializeGame(bad)).toThrow(/verzió/i);
  });

  it('elutasítja az érvénytelen GameState-et vagy RNG-állapotot', () => {
    expect(() =>
      deserializeGame(JSON.stringify({ version: SAVE_FORMAT_VERSION, state: {}, rng: 1 })),
    ).toThrow();
    const state = createInitialState(content, 'dora');
    expect(() =>
      deserializeGame(JSON.stringify({ version: SAVE_FORMAT_VERSION, state, rng: -5 })),
    ).toThrow();
  });
});
