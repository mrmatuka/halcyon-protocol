import { computeModifier } from '../../src/engine/checks';
import {
  applyChoice,
  canUseCardOnChoice,
  createInitialState,
  getAvailableChoices,
  useHealCard as applyHealCard,
} from '../../src/engine/engine';
import { createRng, nextUint32, type RngState } from '../../src/engine/rng';
import type { Choice, GameState, Hero } from '../../src/engine/schema';
import type { Content } from '../../src/engine/validate';

export type BotStrategy = 'random' | 'stat-aware';

export interface SimulationOptions {
  runsPerHero: number;
  baseSeed: number;
  strategy: BotStrategy;
  maxSteps?: number;
}

export interface CheckStatSummary {
  choiceId: string;
  stat: string;
  attempts: number;
  successes: number;
  successRate: number;
}

export interface HeroSummary {
  heroId: string;
  runs: number;
  endings: Record<string, number>;
  averageSteps: number;
}

export interface SimulationReport {
  strategy: BotStrategy;
  totalRuns: number;
  deadlocks: number;
  averageSteps: number;
  endings: Record<string, number>;
  deathNodes: Record<string, number>;
  checks: Record<string, CheckStatSummary>;
  byHero: Record<string, HeroSummary>;
}

function pickChoice(
  content: Content,
  state: GameState,
  choices: Choice[],
  strategy: BotStrategy,
  botRng: RngState,
): { choice: Choice; useCard: boolean; botRng: RngState } {
  if (strategy === 'random' || choices.length === 1) {
    const step = nextUint32(botRng);
    const choice = choices[step.value % choices.length];
    const cardOk = canUseCardOnChoice(content, state, choice.id);
    const cardStep = nextUint32(step.rng);
    const useCard = cardOk && cardStep.value % 2 === 0;
    return { choice, useCard, botRng: cardStep.rng };
  }

  // Tulajdonság-tudatos stratégia: a legmagasabb esélyű próbát vagy feltételes (jutalmazó) ágat preferálja
  let best = choices[0];
  let bestScore = -Infinity;
  let currRng = botRng;

  for (const c of choices) {
    let score = 7.5; // alapérték próba nélküli választásra
    if ('check' in c) {
      const target =
        state.stats[c.check.stat] + computeModifier(state, content.items, c.check.stat);
      score = canUseCardOnChoice(content, state, c.id) ? 13 : target;
    } else if (c.condition) {
      score = 11; // feltételhez kötött (feloldott) útvonalak előnyben
    }
    // Kis véletlen zaj, hogy egyenlő esélyeknél több ágat is bejárjon
    const jitter = nextUint32(currRng);
    currRng = jitter.rng;
    score += (jitter.value / 0x100000000) * 1.5;

    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  const useCard = canUseCardOnChoice(content, state, best.id);
  return { choice: best, useCard, botRng: currRng };
}

/**
 * F8.2–F8.3 – Determinisztikus szimulációs bot tömeges végigjátszásokhoz.
 */
export function simulateRuns(content: Content, options: SimulationOptions): SimulationReport {
  const maxSteps = options.maxSteps ?? 100;
  const endings: Record<string, number> = {};
  const deathNodes: Record<string, number> = {};
  const checksAcc: Record<
    string,
    { choiceId: string; stat: string; attempts: number; successes: number }
  > = {};
  const byHero: Record<string, HeroSummary> = {};
  const deathSet = new Set(
    content.story.nodes
      .filter((n) => n.kind === 'ending' && n.endingType === 'death')
      .map((n) => n.id),
  );

  let totalRuns = 0;
  let totalSteps = 0;
  let deadlocks = 0;

  for (const hero of content.heroes) {
    let heroSteps = 0;
    const heroEndings: Record<string, number> = {};

    for (let i = 0; i < options.runsPerHero; i++) {
      totalRuns++;
      const seed = `${options.baseSeed}:${options.strategy}:${hero.id}:${i}`;
      let state = createInitialState(content, hero.id);
      let gameRng = createRng(seed);
      let botRng = createRng(`bot:${seed}`);
      let steps = 0;

      while (state.endingId === null && steps < maxSteps) {
        // Tulajdonság-tudatos stratégia: ha alacsony az életerő és van gyógyító kártya, elhasználja
        if (options.strategy === 'stat-aware' && !state.cardUsed && state.stats.eletero <= 6) {
          const hasHeal = (hero as Hero).card.options.some((o) => o.type === 'heal');
          if (hasHeal) {
            state = applyHealCard(content, state);
          }
        }

        const available = getAvailableChoices(content, state);
        if (available.length === 0) {
          deadlocks++;
          break;
        }

        const picked = pickChoice(content, state, available, options.strategy, botRng);
        botRng = picked.botRng;

        const prevNodeId = state.nodeId;
        const res = applyChoice(content, state, picked.choice.id, gameRng, {
          useCard: picked.useCard,
        });
        state = res.state;
        gameRng = res.rng;
        steps++;

        if (res.checkResult) {
          const entry =
            checksAcc[picked.choice.id] ??
            (checksAcc[picked.choice.id] = {
              choiceId: picked.choice.id,
              stat: res.checkResult.stat,
              attempts: 0,
              successes: 0,
            });
          entry.attempts++;
          if (res.checkResult.success) entry.successes++;
        }

        if (state.endingId !== null && deathSet.has(state.endingId)) {
          deathNodes[prevNodeId] = (deathNodes[prevNodeId] ?? 0) + 1;
        }
      }

      if (state.endingId === null) {
        deadlocks++;
      } else {
        endings[state.endingId] = (endings[state.endingId] ?? 0) + 1;
        heroEndings[state.endingId] = (heroEndings[state.endingId] ?? 0) + 1;
      }
      totalSteps += steps;
      heroSteps += steps;
    }

    byHero[hero.id] = {
      heroId: hero.id,
      runs: options.runsPerHero,
      endings: heroEndings,
      averageSteps: Number((heroSteps / options.runsPerHero).toFixed(2)),
    };
  }

  const checks: Record<string, CheckStatSummary> = {};
  for (const [id, c] of Object.entries(checksAcc)) {
    checks[id] = {
      ...c,
      successRate: Number((c.successes / c.attempts).toFixed(3)),
    };
  }

  return {
    strategy: options.strategy,
    totalRuns,
    deadlocks,
    averageSteps: Number((totalSteps / totalRuns).toFixed(2)),
    endings,
    deathNodes,
    checks,
    byHero,
  };
}
