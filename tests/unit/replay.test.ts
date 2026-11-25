import { describe, it, expect } from 'vitest';
import { createInitialState, applyChoice } from '../../src/engine/engine';
import { createRng } from '../../src/engine/rng';
import { serializeGame, deserializeGame } from '../../src/engine/serialization';
import { sampleHeroes, sampleItems, sampleStory } from '../fixtures/sampleContent';

const content = { heroes: sampleHeroes, items: sampleItems, story: sampleStory };

function playRun(seed: number | string, choices: string[]) {
  let state = createInitialState(content, 'dora');
  let rng = createRng(seed);
  const rolls: (number | null)[] = [];
  for (const choiceId of choices) {
    const res = applyChoice(content, state, choiceId, rng);
    state = res.state;
    rng = res.rng;
    if (res.checkResult) rolls.push(res.checkResult.total);
  }
  return { state, rng, rolls };
}

describe('F3.9 – determinisztikus replay', () => {
  it('ugyanaz a seed és döntéssorozat pontosan ugyanazt a végállapotot és dobássorozatot adja', () => {
    const run1 = playRun('replay-seed-42', ['c_bemegy', 'c_fut']);
    const run2 = playRun('replay-seed-42', ['c_bemegy', 'c_fut']);
    expect(run1).toEqual(run2);
  });

  it('félúton elmentett és visszatöltött játék ugyanazt a végállapotot adja, mint a megszakítás nélküli', () => {
    const full = playRun(777, ['c_bemegy', 'c_fut']);

    const s0 = createInitialState(content, 'dora');
    const step1 = applyChoice(content, s0, 'c_bemegy', createRng(777));
    const saved = serializeGame(step1.state, step1.rng);
    const loaded = deserializeGame(saved);
    const step2 = applyChoice(content, loaded.state, 'c_fut', loaded.rng);

    expect(step2.state).toEqual(full.state);
    expect(step2.rng).toBe(full.rng);
    expect(step2.checkResult?.total).toBe(full.rolls[0]);
  });
});
