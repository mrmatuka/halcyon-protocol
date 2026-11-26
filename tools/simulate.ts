import { readFileSync } from 'node:fs';
import { heroesSchema, itemsSchema, storySchema } from '../src/engine/schema';
import { simulateRuns, type BotStrategy } from './lib/simulator';

const content = {
  heroes: heroesSchema.parse(
    JSON.parse(readFileSync('adventures/csendes-jel/heroes.json', 'utf8')),
  ),
  items: itemsSchema.parse(JSON.parse(readFileSync('adventures/csendes-jel/items.json', 'utf8'))),
  story: storySchema.parse(JSON.parse(readFileSync('adventures/csendes-jel/nodes.json', 'utf8'))),
};

const runsPerHero = Number(process.argv[2] ?? 500);
const strategies: BotStrategy[] = ['random', 'stat-aware'];

for (const strategy of strategies) {
  const report = simulateRuns(content, { runsPerHero, baseSeed: 2026, strategy });
  console.log(`\n=== Szimuláció (${strategy}, ${report.totalRuns} futás) ===`);
  console.log(`Holtpontok: ${report.deadlocks} | Átlagos hossz: ${report.averageSteps} lépés`);
  console.log('Befejezések:');
  for (const [id, count] of Object.entries(report.endings).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / report.totalRuns) * 100).toFixed(1);
    console.log(`  - ${id}: ${count} (${pct}%)`);
  }
  console.log('Halálcsomópontok (honnan következett be halál):');
  for (const [id, count] of Object.entries(report.deathNodes).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${id}: ${count}`);
  }
  console.log('Próbánkénti sikerarány:');
  for (const c of Object.values(report.checks)) {
    console.log(
      `  - ${c.choiceId} (${c.stat}): ${(c.successRate * 100).toFixed(1)}% (${c.successes}/${c.attempts})`,
    );
  }
}
