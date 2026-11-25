import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { storySchema } from '../../src/engine/schema';
import { illustrationsSchema } from '../../src/content/illustrations';

describe('F7.4 – Csomópont-illusztrációk megléte és alt-szövegek', () => {
  it('minden csomóponthoz tartozik bejegyzés, nem üres alt-szöveg és létező képfájl', () => {
    const story = storySchema.parse(JSON.parse(readFileSync('content/nodes.json', 'utf8')));
    const illustrations = illustrationsSchema.parse(
      JSON.parse(readFileSync('content/illustrations.json', 'utf8')),
    );

    const byNode = new Map(illustrations.map((i) => [i.nodeId, i]));
    expect(byNode.size).toBe(illustrations.length);

    for (const node of story.nodes) {
      const entry = byNode.get(node.id);
      expect(entry, `Hiányzó illusztráció-bejegyzés: ${node.id}`).toBeDefined();
      expect(entry!.alt.trim().length).toBeGreaterThan(5);
      const diskPath = `public/images/${entry!.file}`;
      expect(existsSync(diskPath), `Hiányzó képfájl: ${diskPath}`).toBe(true);
      expect(statSync(diskPath).size).toBeGreaterThan(1000);
    }
  });
});
