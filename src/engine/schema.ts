import { z } from 'zod';

/** Azonosító: kisbetű, szám és alávonás; betűvel kezdődik. */
export const idSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*$/,
    'Az azonosító csak kisbetűt, számot és alávonást tartalmazhat, és betűvel kezdődik',
  );

const nonEmpty = z.string().min(1);
const statValue = z.number().int().min(0);

export const checkStatSchema = idSchema.refine((stat) => stat !== 'eletero');
export const statSchema = idSchema;

export type CheckStat = z.infer<typeof checkStatSchema>;
export type Stat = z.infer<typeof statSchema>;

export const statsSchema = z.object({ eletero: statValue }).catchall(statValue);
export type Stats = z.infer<typeof statsSchema>;

// ---------- Condition ----------

export type Condition =
  | { type: 'hasItem'; itemId: string }
  | { type: 'flag'; flag: string; value?: boolean }
  | { type: 'statAtLeast'; stat: Stat; value: number }
  | { type: 'all'; conditions: Condition[] }
  | { type: 'any'; conditions: Condition[] }
  | { type: 'not'; condition: Condition };

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.strictObject({ type: z.literal('hasItem'), itemId: idSchema }),
    z.strictObject({ type: z.literal('flag'), flag: idSchema, value: z.boolean().optional() }),
    z.strictObject({ type: z.literal('statAtLeast'), stat: statSchema, value: statValue }),
    z.strictObject({ type: z.literal('all'), conditions: z.array(conditionSchema).min(1) }),
    z.strictObject({ type: z.literal('any'), conditions: z.array(conditionSchema).min(1) }),
    z.strictObject({ type: z.literal('not'), condition: conditionSchema }),
  ]),
);

// ---------- Effect ----------

export const effectSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('changeStat'),
    stat: statSchema,
    delta: z
      .number()
      .int()
      .refine((n) => n !== 0, 'A változás nem lehet 0'),
  }),
  z.strictObject({ type: z.literal('addItem'), itemId: idSchema }),
  z.strictObject({ type: z.literal('removeItem'), itemId: idSchema }),
  z.strictObject({ type: z.literal('setFlag'), flag: idSchema, value: z.boolean().optional() }),
]);
export type Effect = z.infer<typeof effectSchema>;

// ---------- Hero, Card ----------

export const cardOptionSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('autoSuccess'),
    stats: z.array(checkStatSchema).min(1),
    choiceIds: z.array(idSchema).min(1).optional(),
  }),
  z.strictObject({ type: z.literal('reroll'), stats: z.array(checkStatSchema).min(1) }),
  z.strictObject({ type: z.literal('heal'), amount: z.number().int().positive() }),
]);
export type CardOption = z.infer<typeof cardOptionSchema>;

export const cardSchema = z.strictObject({
  id: idSchema,
  name: nonEmpty,
  description: z.string(),
  options: z.array(cardOptionSchema).min(1),
});
export type Card = z.infer<typeof cardSchema>;

export const heroPortraitSchema = z
  .string()
  .max(100_000)
  .regex(
    /^(?:preset:(?:scout|scholar|guardian|mediator)-[12]|data:image\/jpeg;base64,[a-z0-9+/=]+)$/i,
  );

export const heroSchema = z.strictObject({
  id: idSchema,
  name: nonEmpty,
  role: z.string(),
  description: z.string(),
  stats: statsSchema.refine((s) => s.eletero >= 1, {
    message: 'Az életerő legalább 1',
    path: ['eletero'],
  }),
  card: cardSchema,
  portrait: heroPortraitSchema.optional(),
});
export type Hero = z.infer<typeof heroSchema>;
export const heroesSchema = z.array(heroSchema);

// ---------- Item ----------

export const modifierSchema = z.strictObject({
  stat: checkStatSchema,
  delta: z
    .number()
    .int()
    .refine((n) => n !== 0, 'A módosító nem lehet 0'),
  nodeId: idSchema.optional(),
});
export type Modifier = z.infer<typeof modifierSchema>;

export const itemSchema = z.strictObject({
  id: idSchema,
  name: nonEmpty,
  description: z.string(),
  modifiers: z.array(modifierSchema).optional(),
});
export type Item = z.infer<typeof itemSchema>;
export const itemsSchema = z.array(itemSchema);

// ---------- Choice, StoryNode, Story ----------

export const outcomeSchema = z.strictObject({
  effects: z.array(effectSchema).optional(),
  target: idSchema,
});
export type Outcome = z.infer<typeof outcomeSchema>;

export const simpleChoiceSchema = z.strictObject({
  id: idSchema,
  text: nonEmpty,
  condition: conditionSchema.optional(),
  effects: z.array(effectSchema).optional(),
  target: idSchema,
});
export type SimpleChoice = z.infer<typeof simpleChoiceSchema>;

export const checkedChoiceSchema = z.strictObject({
  id: idSchema,
  text: nonEmpty,
  condition: conditionSchema.optional(),
  check: z.strictObject({ stat: checkStatSchema }),
  success: outcomeSchema,
  failure: outcomeSchema,
});
export type CheckedChoice = z.infer<typeof checkedChoiceSchema>;

export const choiceSchema = z.union([simpleChoiceSchema, checkedChoiceSchema]);
export type Choice = z.infer<typeof choiceSchema>;

export const sceneNodeSchema = z.strictObject({
  kind: z.literal('scene'),
  id: idSchema,
  title: nonEmpty,
  text: z.string(),
  choices: z.array(choiceSchema).min(1),
});

export const endingNodeSchema = z.strictObject({
  kind: z.literal('ending'),
  id: idSchema,
  title: nonEmpty,
  text: z.string(),
  endingType: z.enum(['victory', 'death']),
});

export const storyNodeSchema = z.discriminatedUnion('kind', [sceneNodeSchema, endingNodeSchema]);
export type StoryNode = z.infer<typeof storyNodeSchema>;

export const storySchema = z.strictObject({
  startNodeId: idSchema,
  deathEndingId: idSchema,
  nodes: z.array(storyNodeSchema).min(1),
});
export type Story = z.infer<typeof storySchema>;

// ---------- GameState ----------

export const gameStateSchema = z.strictObject({
  heroId: idSchema,
  customHero: heroSchema.optional(),
  difficultyModifier: z.number().int().min(-4).max(4).optional(),
  nodeId: idSchema,
  route: z
    .strictObject({
      nodeIds: z.array(idSchema).min(1),
      partial: z.boolean(),
    })
    .optional(),
  stats: statsSchema,
  maxHp: z.number().int().min(1),
  items: z
    .array(idSchema)
    .refine((a) => new Set(a).size === a.length, 'A tárgyak nem ismétlődhetnek'),
  flags: z.record(idSchema, z.boolean()),
  cardUsed: z.boolean(),
  endingId: idSchema.nullable(),
});
export type GameState = z.infer<typeof gameStateSchema>;
