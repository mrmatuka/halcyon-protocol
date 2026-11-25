import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { simulateRuns } from '../../tools/lib/simulator';
import { heroesSchema, itemsSchema, storySchema } from '../../src/engine/schema';
import type { Content } from '../../src/engine/validate';

function loadRealContent(): Content {
  return {
    heroes: heroesSchema.parse(JSON.parse(readFileSync('content/heroes.json', 'utf8'))),
    items: itemsSchema.parse(JSON.parse(readFileSync('content/items.json', 'utf8'))),
    story: storySchema.parse(JSON.parse(readFileSync('content/nodes.json', 'utf8'))),
  };
}

describe('F8.2–F8.3 – Szimulációs bot és statisztikák', () => {
  it('determinisztikus: azonos seeddel azonos statisztikát ad', () => {
    const content = loadRealContent();
    const a = simulateRuns(content, { runsPerHero: 40, baseSeed: 100, strategy: 'random' });
    const b = simulateRuns(content, { runsPerHero: 40, baseSeed: 100, strategy: 'random' });
    expect(a).toEqual(b);
  });

  it('véletlen és tulajdonság-tudatos stratégiával sincs holtpont, és mindhárom nem-halál befejezés előfordul', () => {
    const content = loadRealContent();
    const randomStats = simulateRuns(content, {
      runsPerHero: 150,
      baseSeed: 2026,
      strategy: 'random',
    });
    const smartStats = simulateRuns(content, {
      runsPerHero: 150,
      baseSeed: 2026,
      strategy: 'stat-aware',
    });

    expect(randomStats.deadlocks).toBe(0);
    expect(smartStats.deadlocks).toBe(0);
    expect(randomStats.totalRuns).toBe(450);
    expect(randomStats.averageSteps).toBeGreaterThan(3);

    // Mindhárom nem-halál befejezés elérhető
    expect(randomStats.endings['e1_nema_menekules'] ?? 0).toBeGreaterThan(0);
    expect(randomStats.endings['e2_tuz_a_jegen'] ?? 0).toBeGreaterThan(0);
    expect(randomStats.endings['e3_szallitmany'] ?? 0).toBeGreaterThan(0);

    // Próbánkénti statisztikák gyűlnek
    expect(Object.keys(randomStats.checks).length).toBeGreaterThan(0);
    for (const check of Object.values(randomStats.checks)) {
      expect(check.attempts).toBeGreaterThan(0);
      expect(check.successRate).toBeGreaterThanOrEqual(0);
      expect(check.successRate).toBeLessThanOrEqual(1);
    }
  });
});
