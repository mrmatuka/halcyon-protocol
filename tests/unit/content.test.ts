import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { heroesSchema, itemsSchema, storySchema } from '../../src/engine/schema';
import { validateContent } from '../../src/engine/validate';
import { applyChoice, createInitialState } from '../../src/engine/engine';
import { createRng } from '../../src/engine/rng';

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('F6.2 – Valódi történetgráf JSON validáció', () => {
  it('a heroes.json, items.json és nodes.json átmegy a zod sémákon és a hivatkozás-ellenőrzésen', () => {
    const heroes = heroesSchema.parse(loadJson('content/heroes.json'));
    const items = itemsSchema.parse(loadJson('content/items.json'));
    const story = storySchema.parse(loadJson('content/nodes.json'));

    expect(heroes).toHaveLength(3);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(validateContent({ heroes, items, story })).toEqual([]);

    const scenes = story.nodes.filter((n) => n.kind === 'scene');
    const victories = story.nodes.filter((n) => n.kind === 'ending' && n.endingType === 'victory');
    const deaths = story.nodes.filter((n) => n.kind === 'ending' && n.endingType === 'death');

    expect(scenes).toHaveLength(15);
    expect(victories.length).toBeGreaterThanOrEqual(3);
    expect(deaths.length).toBeGreaterThanOrEqual(2);
  });

  it('M1 prototípus-útvonal: legalább 2 eltérő nem-halál befejezés elérhető a motoron', () => {
    const content = {
      heroes: heroesSchema.parse(loadJson('content/heroes.json')),
      items: itemsSchema.parse(loadJson('content/items.json')),
      story: storySchema.parse(loadJson('content/nodes.json')),
    };

    // Útvonal 1 -> E3 (Szállítmány)
    let s1 = createInitialState(content, 'vass_dora');
    let r1 = createRng('m1-e3');
    for (const choiceId of [
      'c_n01_fobejarat',
      'c_n02_sajat_ut',
      'c_n05_tovabb',
      'c_n06_adotorony',
      'c_n07_vizsgalat',
      'c_n10_meghallgat',
      'c_n13_elfogad',
    ]) {
      const res = applyChoice(content, s1, choiceId, r1);
      s1 = res.state;
      r1 = res.rng;
    }
    expect(s1.endingId).toBe('e3_szallitmany');

    // Útvonal 2 -> E2 (Tűz a jégen) Dóra Rövidzár kártyájával a szerverteremben
    let s2 = createInitialState(content, 'vass_dora');
    let r2 = createRng('m1-e2');
    const steps: Array<{ id: string; useCard?: boolean }> = [
      { id: 'c_n01_fobejarat' },
      { id: 'c_n02_sajat_ut' },
      { id: 'c_n05_tovabb' },
      { id: 'c_n06_adotorony' },
      { id: 'c_n07_vizsgalat' },
      { id: 'c_n10_szembesit' },
      { id: 'c_n11_leallit', useCard: true },
      { id: 'c_n12_tulterheles' },
      { id: 'c_n15_futas_tuz' },
    ];
    for (const step of steps) {
      const res = applyChoice(content, s2, step.id, r2, { useCard: step.useCard });
      s2 = res.state;
      r2 = res.rng;
    }
    expect(s2.endingId).toBe('e2_tuz_a_jegen');
  });
});
