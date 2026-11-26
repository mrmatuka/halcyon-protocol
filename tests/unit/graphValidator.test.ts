import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateStoryGraph } from '../../tools/lib/graphValidator';
import { heroesSchema, itemsSchema, storySchema } from '../../src/engine/schema';
import { sampleHeroes, sampleItems, sampleStory } from '../fixtures/sampleContent';
import type { Content } from '../../src/engine/validate';

const clone = <T>(v: T): T => structuredClone(v);

describe('F8.1 – Determinisztikus gráfvalidátor', () => {
  it('a valós Csendes Jel történetgráf hibátlan (nincs holtpont, elérhetetlen csomópont, kijárat nélküli ciklus)', () => {
    const content: Content = {
      heroes: heroesSchema.parse(
        JSON.parse(readFileSync('adventures/csendes-jel/heroes.json', 'utf8')),
      ),
      items: itemsSchema.parse(
        JSON.parse(readFileSync('adventures/csendes-jel/items.json', 'utf8')),
      ),
      story: storySchema.parse(
        JSON.parse(readFileSync('adventures/csendes-jel/nodes.json', 'utf8')),
      ),
    };
    expect(validateStoryGraph(content)).toEqual([]);
  });

  it('jelzi az elérhetetlen csomópontot és befejezést', () => {
    const story = clone(sampleStory);
    story.nodes.push({
      kind: 'ending',
      id: 'e_arva',
      title: 'Árva',
      text: 'Soha nem éred el.',
      endingType: 'victory',
    });
    const issues = validateStoryGraph({ heroes: sampleHeroes, items: sampleItems, story });
    expect(issues.some((i) => i.code === 'UNREACHABLE_NODE' && i.nodeId === 'e_arva')).toBe(true);
  });

  it('jelzi a kijárat nélküli ciklust', () => {
    const story = clone(sampleStory);
    story.nodes.push(
      {
        kind: 'scene',
        id: 'n_loop_a',
        title: 'A',
        text: '',
        choices: [{ id: 'c_ab', text: 'B-be', target: 'n_loop_b' }],
      },
      {
        kind: 'scene',
        id: 'n_loop_b',
        title: 'B',
        text: '',
        choices: [{ id: 'c_ba', text: 'A-ba', target: 'n_loop_a' }],
      },
    );
    const start = story.nodes[0];
    if (start.kind === 'scene') {
      start.choices.push({ id: 'c_to_loop', text: 'Ciklusba', target: 'n_loop_a' });
    }
    const issues = validateStoryGraph({ heroes: sampleHeroes, items: sampleItems, story });
    expect(issues.some((i) => i.code === 'CYCLE_WITHOUT_EXIT')).toBe(true);
  });

  it('jelzi a soha nem teljesülő feltételt (olyan tárgy vagy flag, amit semmi nem ad meg)', () => {
    const story = clone(sampleStory);
    // A sampleStory-ban a 'kartya' tárgyat semmilyen effekt nem adja hozzá!
    const issues = validateStoryGraph({ heroes: sampleHeroes, items: sampleItems, story });
    expect(
      issues.some((i) => i.code === 'UNSATISFIABLE_CONDITION' && i.message.includes('kartya')),
    ).toBe(true);
  });

  it('jelzi a holtpontot, ha egy jelenet minden választásának feltétele teljesíthetetlen', () => {
    const story = clone(sampleStory);
    const n2 = story.nodes[1];
    if (n2.kind === 'scene') {
      n2.choices = [
        {
          id: 'c_lehetetlen',
          text: 'Lehetetlen',
          condition: { type: 'flag', flag: 'soha_nincs' },
          target: 'e1_siker',
        },
      ];
    }
    const issues = validateStoryGraph({ heroes: sampleHeroes, items: sampleItems, story });
    expect(issues.some((i) => i.code === 'DEAD_END' && i.nodeId === 'n02_zarlat')).toBe(true);
  });
});
