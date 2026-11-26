import { expect, it } from 'vitest';
import { createInitialState } from '../../src/engine/engine';
import { createRng } from '../../src/engine/rng';
import { LocalStorageSaveRepository } from '../../src/persistence/localStorageSaveRepository';
import { adventureSaves, migrateSilentSignalSaves } from '../../src/platform/saves';
import { sampleHeroes, sampleItems, sampleStory } from '../fixtures/sampleContent';

it('preserves existing saves and migrates the old format once into the original adventure', async () => {
  const content = { heroes: sampleHeroes, items: sampleItems, story: sampleStory };
  const state = createInitialState(content, sampleHeroes[0].id);
  const rng = createRng('old');
  const metadata = { heroName: 'Hero', nodeTitle: 'Scene' };
  localStorage.clear();
  const legacy = new LocalStorageSaveRepository();
  await legacy.save('slot1', state, rng, metadata);
  const silent = adventureSaves('csendes-jel');
  const lantern = adventureSaves('lantern-keeper');
  await lantern.save('slot1', state, createRng('separate'), metadata);
  migrateSilentSignalSaves();
  expect(await silent.load('slot1')).toMatchObject({ state, rng });
  expect((await lantern.load('slot1')).rng).toEqual(createRng('separate'));
  await silent.delete('slot1');
  migrateSilentSignalSaves();
  await expect(silent.load('slot1')).rejects.toThrow();
  expect((await legacy.load('slot1')).rng).toEqual(rng);
});
