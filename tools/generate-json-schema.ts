import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { adventureManifestSchema, translationsSchema } from '../src/platform/adventure';
import { contentJsonSchemas } from '../src/engine/jsonSchema';

mkdirSync('content/schema', { recursive: true });
for (const [name, schema] of Object.entries({
  ...contentJsonSchemas,
  'manifest.schema.json': z.toJSONSchema(adventureManifestSchema),
  'translations.schema.json': z.toJSONSchema(translationsSchema),
})) {
  writeFileSync(`content/schema/${name}`, JSON.stringify(schema, null, 2) + '\n', 'utf8');
  console.log(`írva: content/schema/${name}`);
}
