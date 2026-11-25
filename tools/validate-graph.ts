import { readFileSync } from 'node:fs';
import { heroesSchema, itemsSchema, storySchema } from '../src/engine/schema';
import { validateStoryGraph } from './lib/graphValidator';

const content = {
  heroes: heroesSchema.parse(JSON.parse(readFileSync('content/heroes.json', 'utf8'))),
  items: itemsSchema.parse(JSON.parse(readFileSync('content/items.json', 'utf8'))),
  story: storySchema.parse(JSON.parse(readFileSync('content/nodes.json', 'utf8'))),
};

const issues = validateStoryGraph(content);
if (issues.length === 0) {
  console.log('OK: A történetgráf minden determinisztikus ellenőrzésen átment (0 hiba).');
  process.exit(0);
}

console.error(`HIBA: ${issues.length} gráfprobléma található:`);
for (const issue of issues) {
  console.error(`- [${issue.code}] ${issue.message}`);
}
process.exit(1);
