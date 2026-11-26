import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { createInitialState } from '../../src/engine/engine';
import { createRng } from '../../src/engine/rng';
import { heroesSchema, itemsSchema, storySchema } from '../../src/engine/schema';
import { serializeGame } from '../../src/engine/serialization';

function readContent(file: string): unknown {
  return JSON.parse(
    readFileSync(new URL(`../../adventures/csendes-jel/${file}.json`, import.meta.url), 'utf8'),
  );
}

export async function continueLegacyRun(page: Page, heroId: string, seed: string) {
  const content = {
    heroes: heroesSchema.parse(readContent('heroes')),
    items: itemsSchema.parse(readContent('items')),
    story: storySchema.parse(readContent('nodes')),
  };
  const hero = content.heroes.find((entry) => entry.id === heroId)!;
  const state = createInitialState(content, heroId);
  delete state.route;
  const envelope = JSON.stringify({
    metadata: {
      savedAt: '2026-11-25T00:00:00.000Z',
      heroName: hero.name,
      nodeTitle: 'Leszállás az Ébenholdon',
    },
    payload: serializeGame(state, createRng(seed)),
  });
  await page.addInitScript((save) => {
    const key = 'kalandjatek:adventure:csendes-jel:autosave';
    if (localStorage.getItem(key) === null) localStorage.setItem(key, save);
  }, envelope);
  await page.goto('/');
  await page.getByRole('button', { name: 'Folytatás', exact: true }).click();
}
