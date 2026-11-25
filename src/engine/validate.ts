import type { Condition, Effect, Hero, Item, Story, StoryNode } from './schema';

export interface ContentError {
  /** Az érintett hely, pl. `story.nodes[n01_start].choices[c_bemegy].target`. */
  path: string;
  /** Magyar nyelvű, az azonosítót tartalmazó hibaüzenet. */
  message: string;
}

export interface Content {
  heroes: Hero[];
  items: Item[];
  story: Story;
}

/**
 * Hivatkozás-ellenőrzés: a három tartalomfájl együtt konzisztens-e.
 * A szerkezeti (séma-) ellenőrzést a zod sémák végzik, ez már a sémán átment adatot feltételez.
 */
export function validateContent({ heroes, items, story }: Content): ContentError[] {
  const errors: ContentError[] = [];
  const add = (path: string, message: string) => errors.push({ path, message });

  const checkUnique = (ids: string[], path: string, label: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id))
        add(
          path,
          `A(z) „${id}" ${label} azonosítónak egyedinek kell lennie, de többször szerepel.`,
        );
      seen.add(id);
    }
  };

  const heroIds = heroes.map((h) => h.id);
  const itemIds = items.map((i) => i.id);
  const nodeIds = story.nodes.map((n) => n.id);
  const choiceIds = story.nodes.flatMap((n) =>
    n.kind === 'scene' ? n.choices.map((c) => c.id) : [],
  );

  checkUnique(heroIds, 'heroes', 'hős');
  checkUnique(itemIds, 'items', 'tárgy');
  checkUnique(nodeIds, 'story.nodes', 'csomópont');
  checkUnique(choiceIds, 'story.nodes', 'választás');

  const nodeSet = new Set(nodeIds);
  const itemSet = new Set(itemIds);
  const choiceSet = new Set(choiceIds);

  const checkNode = (id: string, path: string) => {
    if (!nodeSet.has(id)) add(path, `A(z) „${id}" csomópont nem létezik.`);
  };
  const checkItem = (id: string, path: string) => {
    if (!itemSet.has(id)) add(path, `A(z) „${id}" tárgy nem létezik.`);
  };
  const checkCondition = (c: Condition, path: string): void => {
    switch (c.type) {
      case 'hasItem':
        return checkItem(c.itemId, `${path}.itemId`);
      case 'all':
      case 'any':
        return c.conditions.forEach((sub, i) => checkCondition(sub, `${path}.conditions[${i}]`));
      case 'not':
        return checkCondition(c.condition, `${path}.condition`);
      default:
        return;
    }
  };
  const checkEffects = (effects: Effect[] | undefined, path: string) => {
    effects?.forEach((e, i) => {
      if (e.type === 'addItem' || e.type === 'removeItem')
        checkItem(e.itemId, `${path}[${i}].itemId`);
    });
  };

  // Történet
  checkNode(story.startNodeId, 'story.startNodeId');
  const death: StoryNode | undefined = story.nodes.find((n) => n.id === story.deathEndingId);
  if (!death) {
    add(
      'story.deathEndingId',
      `A(z) „${story.deathEndingId}" halál-befejezés csomópont nem létezik.`,
    );
  } else if (death.kind !== 'ending' || death.endingType !== 'death') {
    add(
      'story.deathEndingId',
      `A(z) „${story.deathEndingId}" csomópontnak halál típusú befejezésnek kell lennie.`,
    );
  }

  for (const node of story.nodes) {
    if (node.kind !== 'scene') continue;
    for (const choice of node.choices) {
      const base = `story.nodes[${node.id}].choices[${choice.id}]`;
      if (choice.condition) checkCondition(choice.condition, `${base}.condition`);
      if ('check' in choice) {
        checkNode(choice.success.target, `${base}.success.target`);
        checkNode(choice.failure.target, `${base}.failure.target`);
        checkEffects(choice.success.effects, `${base}.success.effects`);
        checkEffects(choice.failure.effects, `${base}.failure.effects`);
      } else {
        checkNode(choice.target, `${base}.target`);
        checkEffects(choice.effects, `${base}.effects`);
      }
    }
  }

  // Tárgyak
  for (const item of items) {
    item.modifiers?.forEach((m, i) => {
      if (m.nodeId !== undefined) checkNode(m.nodeId, `items[${item.id}].modifiers[${i}].nodeId`);
    });
  }

  // Hősök
  for (const hero of heroes) {
    hero.card.options.forEach((o, i) => {
      if (o.type === 'autoSuccess') {
        o.choiceIds?.forEach((id) => {
          if (!choiceSet.has(id)) {
            add(
              `heroes[${hero.id}].card.options[${i}].choiceIds`,
              `A(z) „${id}" választás nem létezik.`,
            );
          }
        });
      }
    });
  }

  return errors;
}
