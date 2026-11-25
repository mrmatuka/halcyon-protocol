import { describe, it, expect } from 'vitest';
import {
  heroSchema,
  itemSchema,
  storySchema,
  conditionSchema,
  effectSchema,
  gameStateSchema,
} from '../../src/engine/schema';
import { sampleHeroes, sampleItems, sampleStory } from '../fixtures/sampleContent';

const clone = <T>(v: T): T => structuredClone(v);

describe('heroSchema', () => {
  it('elfogadja az érvényes hőst', () => {
    expect(heroSchema.safeParse(sampleHeroes[0]).success).toBe(true);
  });

  it('elutasítja a hiányzó azonosítót', () => {
    const hero: Record<string, unknown> = clone(sampleHeroes[0]) as unknown as Record<
      string,
      unknown
    >;
    delete hero.id;
    expect(heroSchema.safeParse(hero).success).toBe(false);
  });

  it('elutasítja az ékezetes vagy nagybetűs azonosítót', () => {
    expect(heroSchema.safeParse({ ...sampleHeroes[0], id: 'Dóra' }).success).toBe(false);
  });

  it('elutasítja a negatív és a tört statértéket', () => {
    const neg = clone(sampleHeroes[0]);
    neg.stats.reflex = -1;
    expect(heroSchema.safeParse(neg).success).toBe(false);
    const frac = clone(sampleHeroes[0]);
    frac.stats.technika = 7.5;
    expect(heroSchema.safeParse(frac).success).toBe(false);
  });

  it('elutasítja a 0 életerőt', () => {
    const hero = clone(sampleHeroes[0]);
    hero.stats.eletero = 0;
    expect(heroSchema.safeParse(hero).success).toBe(false);
  });

  it('elutasítja az ismeretlen mezőt (strict)', () => {
    expect(heroSchema.safeParse({ ...sampleHeroes[0], extra: 1 }).success).toBe(false);
  });

  it('elutasítja az üres opciójú kártyát', () => {
    const hero = clone(sampleHeroes[0]);
    hero.card.options = [];
    expect(heroSchema.safeParse(hero).success).toBe(false);
  });

  it('elfogadja a reroll, heal és choiceIds opciókat', () => {
    const hero = clone(sampleHeroes[0]);
    hero.card.options = [
      { type: 'reroll', stats: ['reflex', 'kitartas'] },
      { type: 'heal', amount: 5 },
      { type: 'autoSuccess', stats: ['technika'], choiceIds: ['c_valami'] },
    ];
    expect(heroSchema.safeParse(hero).success).toBe(true);
  });

  it('elutasítja az életerő mint próbázható stat használatát a kártyán', () => {
    const hero = clone(sampleHeroes[0]);
    hero.card.options = [{ type: 'reroll', stats: ['eletero'] } as never];
    expect(heroSchema.safeParse(hero).success).toBe(false);
  });

  it('elutasítja a 0 vagy negatív gyógyítást', () => {
    const hero = clone(sampleHeroes[0]);
    hero.card.options = [{ type: 'heal', amount: 0 }];
    expect(heroSchema.safeParse(hero).success).toBe(false);
  });
});

describe('itemSchema', () => {
  it('elfogadja a módosítóval és a nélküle megadott tárgyat', () => {
    for (const item of sampleItems) expect(itemSchema.safeParse(item).success).toBe(true);
  });

  it('elutasítja a 0 delta módosítót', () => {
    const item = clone(sampleItems[0]);
    item.modifiers = [{ stat: 'reflex', delta: 0 }];
    expect(itemSchema.safeParse(item).success).toBe(false);
  });

  it('elutasítja az életerő módosítót', () => {
    const item = clone(sampleItems[0]);
    item.modifiers = [{ stat: 'eletero', delta: 1 } as never];
    expect(itemSchema.safeParse(item).success).toBe(false);
  });
});

describe('conditionSchema', () => {
  it('elfogadja az összes feltételfajtát, beágyazva is', () => {
    const cond = {
      type: 'any',
      conditions: [
        { type: 'hasItem', itemId: 'kartya' },
        { type: 'flag', flag: 'mara_lie' },
        { type: 'flag', flag: 'x', value: false },
        { type: 'statAtLeast', stat: 'eletero', value: 5 },
        { type: 'not', condition: { type: 'all', conditions: [{ type: 'flag', flag: 'y' }] } },
      ],
    };
    expect(conditionSchema.safeParse(cond).success).toBe(true);
  });

  it('elutasítja az üres all/any listát', () => {
    expect(conditionSchema.safeParse({ type: 'all', conditions: [] }).success).toBe(false);
    expect(conditionSchema.safeParse({ type: 'any', conditions: [] }).success).toBe(false);
  });

  it('elutasítja az ismeretlen típust', () => {
    expect(conditionSchema.safeParse({ type: 'magic' }).success).toBe(false);
  });
});

describe('effectSchema', () => {
  it('elfogadja az összes effektfajtát', () => {
    for (const e of [
      { type: 'changeStat', stat: 'eletero', delta: -3 },
      { type: 'addItem', itemId: 'hopatron' },
      { type: 'removeItem', itemId: 'hopatron' },
      { type: 'setFlag', flag: 'ment' },
      { type: 'setFlag', flag: 'ment', value: false },
    ]) {
      expect(effectSchema.safeParse(e).success).toBe(true);
    }
  });

  it('elutasítja a 0 delta változtatást', () => {
    expect(effectSchema.safeParse({ type: 'changeStat', stat: 'reflex', delta: 0 }).success).toBe(
      false,
    );
  });

  it('elutasítja a tört deltát', () => {
    expect(effectSchema.safeParse({ type: 'changeStat', stat: 'reflex', delta: 0.5 }).success).toBe(
      false,
    );
  });
});

describe('storySchema', () => {
  it('elfogadja a mintatörténetet', () => {
    const r = storySchema.safeParse(sampleStory);
    expect(r.success).toBe(true);
  });

  it('elutasítja a választás nélküli jelenetet', () => {
    const story = clone(sampleStory);
    const scene = story.nodes[0];
    if (scene.kind === 'scene') scene.choices = [];
    expect(storySchema.safeParse(story).success).toBe(false);
  });

  it('elutasítja a befejezést, amelynek választásai vannak', () => {
    const story = clone(sampleStory);
    story.nodes[2] = { ...story.nodes[2], choices: [] } as never;
    expect(storySchema.safeParse(story).success).toBe(false);
  });

  it('elutasítja a befejezést endingType nélkül', () => {
    const story = clone(sampleStory);
    delete (story.nodes[2] as Record<string, unknown>).endingType;
    expect(storySchema.safeParse(story).success).toBe(false);
  });

  it('elutasítja a választást, amelyen egyszerre van target és check', () => {
    const story = clone(sampleStory);
    const scene = story.nodes[1];
    if (scene.kind === 'scene') {
      (scene.choices[0] as Record<string, unknown>).target = 'e1_siker';
    }
    expect(storySchema.safeParse(story).success).toBe(false);
  });

  it('elutasítja a check nélküli választást, amelynek nincs targetje', () => {
    const story = clone(sampleStory);
    const scene = story.nodes[0];
    if (scene.kind === 'scene') delete (scene.choices[0] as Record<string, unknown>).target;
    expect(storySchema.safeParse(story).success).toBe(false);
  });

  it('elutasítja a próbát, amelyből hiányzik a failure ág', () => {
    const story = clone(sampleStory);
    const scene = story.nodes[1];
    if (scene.kind === 'scene') delete (scene.choices[0] as Record<string, unknown>).failure;
    expect(storySchema.safeParse(story).success).toBe(false);
  });

  it('elutasítja az életerőre irányuló próbát', () => {
    const story = clone(sampleStory);
    const scene = story.nodes[1];
    if (scene.kind === 'scene')
      (scene.choices[0] as Record<string, unknown>).check = { stat: 'eletero' };
    expect(storySchema.safeParse(story).success).toBe(false);
  });
});

describe('gameStateSchema', () => {
  it('elfogadja az érvényes állapotot', () => {
    const state = {
      heroId: 'dora',
      nodeId: 'n01_start',
      stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
      maxHp: 12,
      items: [],
      flags: {},
      cardUsed: false,
      endingId: null,
    };
    expect(gameStateSchema.safeParse(state).success).toBe(true);
  });

  it('elutasítja a duplikált tárgyakat', () => {
    const state = {
      heroId: 'dora',
      nodeId: 'n01_start',
      stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
      maxHp: 12,
      items: ['kartya', 'kartya'],
      flags: {},
      cardUsed: false,
      endingId: null,
    };
    expect(gameStateSchema.safeParse(state).success).toBe(false);
  });
});
