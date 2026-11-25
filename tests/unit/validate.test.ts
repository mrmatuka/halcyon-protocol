import { describe, it, expect } from 'vitest';
import { validateContent } from '../../src/engine/validate';
import { sampleHeroes, sampleItems, sampleStory } from '../fixtures/sampleContent';
import type { Story } from '../../src/engine/schema';

const clone = <T>(v: T): T => structuredClone(v);
const content = (story: Story = sampleStory) => ({
  heroes: sampleHeroes,
  items: sampleItems,
  story,
});

describe('validateContent', () => {
  it('a mintatartalomra nem ad hibát', () => {
    expect(validateContent(content())).toEqual([]);
  });

  it('jelzi a duplikált csomópont-azonosítót', () => {
    const story = clone(sampleStory);
    story.nodes.push(clone(story.nodes[2]));
    const errors = validateContent(content(story));
    expect(errors.some((e) => e.message.includes('e1_siker') && e.message.includes('egyedi'))).toBe(
      true,
    );
  });

  it('jelzi a duplikált választás-azonosítót', () => {
    const story = clone(sampleStory);
    const a = story.nodes[0];
    const b = story.nodes[1];
    if (a.kind === 'scene' && b.kind === 'scene') b.choices[1].id = a.choices[0].id;
    const errors = validateContent(content(story));
    expect(errors.some((e) => e.message.includes('c_bemegy'))).toBe(true);
  });

  it('jelzi a hiányzó startNodeId csomópontot', () => {
    const story = { ...clone(sampleStory), startNodeId: 'nincs_ilyen' };
    const errors = validateContent(content(story));
    expect(
      errors.some((e) => e.path === 'story.startNodeId' && e.message.includes('nincs_ilyen')),
    ).toBe(true);
  });

  it('jelzi, ha a deathEndingId nem halál-befejezés', () => {
    const story = { ...clone(sampleStory), deathEndingId: 'e1_siker' };
    const errors = validateContent(content(story));
    expect(errors.some((e) => e.path === 'story.deathEndingId')).toBe(true);
  });

  it('jelzi a hiányzó deathEndingId csomópontot', () => {
    const story = { ...clone(sampleStory), deathEndingId: 'nincs_ilyen' };
    const errors = validateContent(content(story));
    expect(
      errors.some((e) => e.path === 'story.deathEndingId' && e.message.includes('nincs_ilyen')),
    ).toBe(true);
  });

  it('jelzi a nem létező célcsomópontot az útvonallal együtt', () => {
    const story = clone(sampleStory);
    const scene = story.nodes[0];
    if (scene.kind === 'scene' && 'target' in scene.choices[0]) scene.choices[0].target = 'hianyzo';
    const errors = validateContent(content(story));
    const err = errors.find((e) => e.message.includes('hianyzo'));
    expect(err).toBeDefined();
    expect(err!.path).toContain('n01_start');
    expect(err!.path).toContain('c_bemegy');
  });

  it('jelzi a próba ágainak hibás célját', () => {
    const story = clone(sampleStory);
    const scene = story.nodes[1];
    if (scene.kind === 'scene' && 'check' in scene.choices[0]) {
      scene.choices[0].success.target = 'hianyzo_siker';
      scene.choices[0].failure.target = 'hianyzo_kudarc';
    }
    const errors = validateContent(content(story));
    expect(errors.some((e) => e.message.includes('hianyzo_siker'))).toBe(true);
    expect(errors.some((e) => e.message.includes('hianyzo_kudarc'))).toBe(true);
  });

  it('jelzi a nem létező tárgyat a feltételben (beágyazva is)', () => {
    const story = clone(sampleStory);
    const scene = story.nodes[1];
    if (scene.kind === 'scene') {
      scene.choices[1].condition = {
        type: 'not',
        condition: { type: 'any', conditions: [{ type: 'hasItem', itemId: 'nincs_targy' }] },
      };
    }
    const errors = validateContent(content(story));
    expect(errors.some((e) => e.message.includes('nincs_targy'))).toBe(true);
  });

  it('jelzi a nem létező tárgyat az effektben', () => {
    const story = clone(sampleStory);
    const scene = story.nodes[0];
    if (scene.kind === 'scene' && 'effects' in scene.choices[0]) {
      scene.choices[0].effects = [{ type: 'addItem', itemId: 'nincs_targy' }];
    }
    const errors = validateContent(content(story));
    expect(errors.some((e) => e.message.includes('nincs_targy'))).toBe(true);
  });

  it('jelzi a nem létező csomópontot a tárgymódosítóban', () => {
    const items = clone(sampleItems);
    items[0].modifiers = [{ stat: 'reflex', delta: 1, nodeId: 'nincs_csomopont' }];
    const errors = validateContent({ heroes: sampleHeroes, items, story: sampleStory });
    expect(errors.some((e) => e.message.includes('nincs_csomopont'))).toBe(true);
  });

  it('jelzi a nem létező választást a kártya choiceIds mezőjében', () => {
    const heroes = clone(sampleHeroes);
    heroes[0].card.options = [
      { type: 'autoSuccess', stats: ['technika'], choiceIds: ['nincs_valasztas'] },
    ];
    const errors = validateContent({ heroes, items: sampleItems, story: sampleStory });
    expect(errors.some((e) => e.message.includes('nincs_valasztas'))).toBe(true);
  });

  it('jelzi a duplikált hős- és tárgyazonosítót', () => {
    const heroes = [...clone(sampleHeroes), clone(sampleHeroes[0])];
    const items = [...clone(sampleItems), clone(sampleItems[0])];
    const errors = validateContent({ heroes, items, story: sampleStory });
    expect(errors.some((e) => e.message.includes('dora'))).toBe(true);
    expect(errors.some((e) => e.message.includes('hopatron'))).toBe(true);
  });

  it('több hibát egyszerre listáz', () => {
    const story = { ...clone(sampleStory), startNodeId: 'x', deathEndingId: 'y' };
    expect(validateContent(content(story)).length).toBeGreaterThanOrEqual(2);
  });
});
