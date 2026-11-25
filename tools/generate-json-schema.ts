import { mkdirSync, writeFileSync } from 'node:fs';
import { contentJsonSchemas } from '../src/engine/jsonSchema';

mkdirSync('content/schema', { recursive: true });
for (const [name, schema] of Object.entries(contentJsonSchemas)) {
  writeFileSync(`content/schema/${name}`, JSON.stringify(schema, null, 2) + '\n', 'utf8');
  console.log(`írva: content/schema/${name}`);
}
