import { findApplicableCardOption, performCheck, type CheckResult } from './checks';
import { evaluateCondition } from './conditions';
import { applyEffect, applyEffects } from './effects';
import type { RngState } from './rng';
import type { Choice, GameState, Hero, StoryNode } from './schema';
import type { Content } from './validate';

export interface ApplyChoiceOptions {
  useCard?: boolean;
}

export interface ApplyChoiceResult {
  state: GameState;
  rng: RngState;
  checkResult: CheckResult | null;
}

function getHero(content: Content, heroId: string): Hero {
  const hero = content.heroes.find((h) => h.id === heroId);
  if (!hero) throw new Error(`Ismeretlen hős: „${heroId}".`);
  return hero;
}

function getNode(content: Content, nodeId: string): StoryNode {
  const node = content.story.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Ismeretlen csomópont: „${nodeId}".`);
  return node;
}

/** Létrehozza a játék kezdőállapotát a kiválasztott hőssel. */
export function createInitialState(content: Content, heroId: string): GameState {
  const hero = getHero(content, heroId);
  const startNode = getNode(content, content.story.startNodeId);
  return {
    heroId: hero.id,
    nodeId: startNode.id,
    stats: { ...hero.stats },
    maxHp: hero.stats.eletero,
    items: [],
    flags: {},
    cardUsed: false,
    endingId: startNode.kind === 'ending' ? startNode.id : null,
  };
}

/**
 * F3.5 – Visszaadja az aktuális csomóponton elérhető (látható) választásokat.
 * A nem teljesülő feltételű választások rejtettek.
 */
export function getAvailableChoices(content: Content, state: GameState): Choice[] {
  if (state.endingId !== null) return [];
  const node = getNode(content, state.nodeId);
  if (node.kind !== 'scene') return [];
  return node.choices.filter(
    (choice) => choice.condition === undefined || evaluateCondition(choice.condition, state),
  );
}

/** Ellenőrzi, hogy a hős még el nem használt kártyája bevethető-e az adott választáson. */
export function canUseCardOnChoice(content: Content, state: GameState, choiceId: string): boolean {
  if (state.cardUsed || state.endingId !== null) return false;
  const available = getAvailableChoices(content, state);
  const choice = available.find((c) => c.id === choiceId);
  if (!choice || !('check' in choice)) return false;
  const hero = getHero(content, state.heroId);
  return findApplicableCardOption(hero, choice.check.stat, choice.id) !== null;
}

/**
 * Gyógyító képességkártya-opció (pl. Dr. Imre Lili: Stimulátor +5 Életerő) aktiválása
 * bármelyik jelenetben (`scene` csomóponton), választás előtt. Tiszta függvény.
 */
export function useHealCard(content: Content, state: GameState): GameState {
  if (state.endingId !== null) {
    throw new Error('A játék már véget ért.');
  }
  if (state.cardUsed) {
    throw new Error('A képességkártyát már elhasználtad.');
  }
  const node = getNode(content, state.nodeId);
  if (node.kind !== 'scene') {
    throw new Error('Képességkártya csak jelenetben használható.');
  }
  const hero = getHero(content, state.heroId);
  const healOpt = hero.card.options.find((o) => o.type === 'heal');
  if (!healOpt || healOpt.type !== 'heal') {
    throw new Error(`A(z) „${hero.card.name}" kártyának nincs gyógyító opciója.`);
  }
  const healed = applyEffect(state, {
    type: 'changeStat',
    stat: 'eletero',
    delta: healOpt.amount,
  });
  return { ...healed, cardUsed: true };
}

/**
 * F3.6 & F3.7 – Végrehajt egy választást. Tiszta függvény: a bemeneti állapotot nem módosítja.
 * Ha az életerő 0-ra csökken, a motor a `story.deathEndingId` halál-befejezésre irányít.
 */
export function applyChoice(
  content: Content,
  state: GameState,
  choiceId: string,
  rng: RngState,
  options?: ApplyChoiceOptions,
): ApplyChoiceResult {
  if (state.endingId !== null) {
    throw new Error('A játék már befejeződött.');
  }
  const node = getNode(content, state.nodeId);
  if (node.kind !== 'scene') {
    throw new Error(`A(z) „${node.id}" csomópont befejezés, nem lehet választani.`);
  }
  const available = getAvailableChoices(content, state);
  const choice = available.find((c) => c.id === choiceId);
  if (!choice) {
    throw new Error(`A(z) „${choiceId}" választás nem érhető el a(z) „${node.id}" csomóponton.`);
  }

  let nextState: GameState = structuredClone(state);
  let nextRng = rng;
  let checkResult: CheckResult | null = null;
  let targetNodeId: string;

  if ('check' in choice) {
    const hero = getHero(content, nextState.heroId);
    const checkRes = performCheck({
      state: nextState,
      hero,
      items: content.items,
      stat: choice.check.stat,
      choiceId: choice.id,
      rng: nextRng,
      useCard: options?.useCard,
    });
    nextState = checkRes.state;
    nextRng = checkRes.rng;
    checkResult = checkRes.checkResult;

    const outcome = checkResult.success ? choice.success : choice.failure;
    nextState = applyEffects(nextState, outcome.effects ?? []);
    targetNodeId = outcome.target;
  } else {
    if (options?.useCard) {
      throw new Error('Próba nélküli választáson nem használható próbához kötött kártya.');
    }
    nextState = applyEffects(nextState, choice.effects ?? []);
    targetNodeId = choice.target;
  }

  // F3.7: 0 életerő -> azonnali halál-befejezés (deathEndingId)
  if (nextState.stats.eletero <= 0) {
    const deathId = content.story.deathEndingId;
    getNode(content, deathId);
    nextState = {
      ...nextState,
      nodeId: deathId,
      endingId: deathId,
    };
  } else {
    const targetNode = getNode(content, targetNodeId);
    nextState = {
      ...nextState,
      nodeId: targetNode.id,
      endingId: targetNode.kind === 'ending' ? targetNode.id : null,
    };
  }

  return {
    state: nextState,
    rng: nextRng,
    checkResult,
  };
}
