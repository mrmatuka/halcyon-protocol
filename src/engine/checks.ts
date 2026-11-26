import { applyEffect } from './effects';
import { roll2D6, type RngState } from './rng';
import type { CardOption, CheckStat, GameState, Hero, Item } from './schema';

export interface CheckResult {
  stat: CheckStat;
  /** A két kocka értéke; `null`, ha `autoSuccess` kártya miatt nem történt dobás. */
  dice: [number, number] | null;
  /** A két kocka összege; `null`, ha `autoSuccess` kártya miatt nem történt dobás. */
  total: number | null;
  baseStat: number;
  modifier: number;
  /** Célszám: `baseStat + modifier`. A próba sikeres, ha `total <= target`. */
  target: number;
  success: boolean;
  /** Milyen kártyaopció aktiválódott a próbánál (`null`, ha nem fogyott kártya). */
  cardUsed: 'autoSuccess' | 'reroll' | null;
  /** Ha `reroll` kártya aktiválódott, az első (sikertelen) dobás adatai. */
  rerolledFrom: { dice: [number, number]; total: number } | null;
}

export interface PerformCheckParams {
  state: GameState;
  hero: Hero;
  items: readonly Item[];
  stat: CheckStat;
  choiceId: string;
  rng: RngState;
  useCard?: boolean;
}

/** Kiszámítja a birtokolt tárgyakból származó próbamódosítót az aktuális csomóponton. */
export function computeModifier(state: GameState, items: readonly Item[], stat: CheckStat): number {
  let sum = 0;
  for (const itemId of state.items) {
    const item = items.find((i) => i.id === itemId);
    if (!item?.modifiers) continue;
    for (const mod of item.modifiers) {
      if (mod.stat === stat && (mod.nodeId === undefined || mod.nodeId === state.nodeId)) {
        sum += mod.delta;
      }
    }
  }
  return sum;
}

/** Megkeresi a hős kártyáján az adott próbához (stat + choiceId) használható opciót. */
export function findApplicableCardOption(
  hero: Hero,
  stat: CheckStat,
  choiceId: string,
): Extract<CardOption, { type: 'autoSuccess' | 'reroll' }> | null {
  for (const opt of hero.card.options) {
    if (opt.type === 'autoSuccess') {
      const statOk = opt.stats.includes(stat);
      const choiceOk = opt.choiceIds === undefined || opt.choiceIds.includes(choiceId);
      if (statOk && choiceOk) return opt;
    } else if (opt.type === 'reroll') {
      if (opt.stats.includes(stat)) return opt;
    }
  }
  return null;
}

/**
 * Kiértékel egy `2d6 <= tulajdonság + módosító` próbát.
 * Kezeli az `autoSuccess` és `reroll` képességkártyákat, valamint a Szerencse fogyását (−1 minden Szerencse-próba után).
 */
export function performCheck(params: PerformCheckParams): {
  state: GameState;
  rng: RngState;
  checkResult: CheckResult;
} {
  const { state, hero, items, stat, choiceId, rng, useCard = false } = params;
  const baseStat = state.stats[stat];
  const modifier = computeModifier(state, items, stat) + (state.difficultyModifier ?? 0);
  const target = baseStat + modifier;

  let cardOption: Extract<CardOption, { type: 'autoSuccess' | 'reroll' }> | null = null;
  if (useCard) {
    if (state.cardUsed) {
      throw new Error('A képességkártyát már elhasználtad.');
    }
    cardOption = findApplicableCardOption(hero, stat, choiceId);
    if (!cardOption) {
      throw new Error(
        `A(z) „${hero.card.name}" kártya nem használható erre a próbára (${stat}, ${choiceId}).`,
      );
    }
  }

  let nextState: GameState = { ...state, stats: { ...state.stats } };
  let nextRng = rng;
  let dice: [number, number] | null = null;
  let total: number | null = null;
  let success: boolean;
  let usedKind: 'autoSuccess' | 'reroll' | null = null;
  let rerolledFrom: { dice: [number, number]; total: number } | null = null;

  if (cardOption?.type === 'autoSuccess') {
    success = true;
    usedKind = 'autoSuccess';
    nextState = { ...nextState, cardUsed: true };
  } else {
    const first = roll2D6(nextRng);
    nextRng = first.rng;
    dice = first.dice;
    total = first.total;
    success = total <= target;

    if (!success && cardOption?.type === 'reroll') {
      rerolledFrom = { dice: first.dice, total: first.total };
      const second = roll2D6(nextRng);
      nextRng = second.rng;
      dice = second.dice;
      total = second.total;
      success = total <= target;
      usedKind = 'reroll';
      nextState = { ...nextState, cardUsed: true };
    }
  }

  // F3.4: Szerencse-próba után a Szerencse 1-gyel csökken (sikertől függetlenül, min. 0)
  if (stat === 'szerencse') {
    nextState = applyEffect(nextState, { type: 'changeStat', stat: 'szerencse', delta: -1 });
  }

  return {
    state: nextState,
    rng: nextRng,
    checkResult: {
      stat,
      dice,
      total,
      baseStat,
      modifier,
      target,
      success,
      cardUsed: usedKind,
      rerolledFrom,
    },
  };
}
