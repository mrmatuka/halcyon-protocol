import { z } from 'zod';
import { heroesSchema, itemsSchema, storySchema } from './schema';

/** A tartalomfájlok JSON Schema-i a zod sémákból. Kimeneti fájlnév → séma. */
export const contentJsonSchemas: Record<string, object> = {
  'heroes.schema.json': z.toJSONSchema(heroesSchema),
  'items.schema.json': z.toJSONSchema(itemsSchema),
  'nodes.schema.json': z.toJSONSchema(storySchema),
};
