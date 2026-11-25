import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { contentJsonSchemas } from '../../src/engine/jsonSchema';

describe('JSON Schema generálás', () => {
  it('mindhárom fájlhoz készül séma', () => {
    expect(Object.keys(contentJsonSchemas).sort()).toEqual([
      'heroes.schema.json',
      'items.schema.json',
      'nodes.schema.json',
    ]);
  });

  it('a sémák JSON Schema objektumok', () => {
    for (const schema of Object.values(contentJsonSchemas)) {
      expect(schema).toHaveProperty('$schema');
      expect(['object', 'array']).toContain((schema as { type: string }).type);
    }
  });

  it('a content/schema fájlok naprakészek (npm run schema)', () => {
    for (const [name, schema] of Object.entries(contentJsonSchemas)) {
      const onDisk = JSON.parse(readFileSync(`content/schema/${name}`, 'utf8'));
      expect(onDisk).toEqual(JSON.parse(JSON.stringify(schema)));
    }
  });
});
