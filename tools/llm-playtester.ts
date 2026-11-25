import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { heroesSchema, itemsSchema, storySchema } from '../src/engine/schema';
import { createInitialState, getAvailableChoices, applyChoice } from '../src/engine/engine';
import { createRng } from '../src/engine/rng';

/**
 * F8.5 – LLM-es tesztjátékos-agent szerzői segédeszköz.
 * Legenerál egy teljes, emberi/LLM-es értékelésre kész végigjátszási naplót
 * választott hőssel és seeddel, valamint a hozzá tartozó értékelő promptot.
 *
 * Használat: npx tsx tools/llm-playtester.ts [heroId] [seed]
 */
const content = {
  heroes: heroesSchema.parse(JSON.parse(readFileSync('content/heroes.json', 'utf8'))),
  items: itemsSchema.parse(JSON.parse(readFileSync('content/items.json', 'utf8'))),
  story: storySchema.parse(JSON.parse(readFileSync('content/nodes.json', 'utf8'))),
};

const heroId = process.argv[2] ?? content.heroes[0].id;
const seed = process.argv[3] ?? 'playtest-1';
const hero = content.heroes.find((h) => h.id === heroId);
if (!hero) {
  console.error(`Ismeretlen hős: ${heroId}`);
  process.exit(1);
}

let state = createInitialState(content, hero.id);
let rng = createRng(seed);
const transcript: string[] = [
  `# Tesztjátékos napló – ${hero.name} (seed: ${seed})`,
  '',
  'Értékeld a következő végigjátszást játékosi szemszögből: hol volt zavaró a választás, érezhető-e a döntések súlya, kiegyensúlyozott-e a nehézség?',
  '',
];

let step = 0;
while (state.endingId === null && step < 40) {
  const node = content.story.nodes.find((n) => n.id === state.nodeId)!;
  const choices = getAvailableChoices(content, state);
  transcript.push(`## ${step + 1}. ${node.title} (\`${node.id}\`)`);
  transcript.push(node.text);
  transcript.push('');
  transcript.push(`**Elérhető választások:** ${choices.map((c) => `„${c.text}"`).join(' | ')}`);

  const chosen = choices[step % choices.length];
  const res = applyChoice(content, state, chosen.id, rng);
  transcript.push(`**Választott:** „${chosen.text}"`);
  if (res.checkResult) {
    transcript.push(
      `**Próba:** ${res.checkResult.stat} — ${res.checkResult.total ?? 'auto'} ≤ ${res.checkResult.target} → ${res.checkResult.success ? 'Siker' : 'Kudarc'}`,
    );
  }
  transcript.push('');
  state = res.state;
  rng = res.rng;
  step++;
}

const ending = content.story.nodes.find((n) => n.id === state.nodeId)!;
transcript.push(`## Befejezés: ${ending.title} (\`${ending.id}\`)`);
transcript.push(ending.text);

mkdirSync('docs/reports', { recursive: true });
const outPath = `docs/reports/playtest-${hero.id}-${seed}.md`;
writeFileSync(outPath, transcript.join('\n'), 'utf8');
console.log(`Tesztjátékos napló elkészült: ${outPath}`);
