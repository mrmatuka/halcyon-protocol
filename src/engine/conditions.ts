import type { Condition, GameState } from './schema';

/** Kiértékel egy feltételt a játékállapoton. Tiszta függvény. */
export function evaluateCondition(condition: Condition, state: GameState): boolean {
  switch (condition.type) {
    case 'hasItem':
      return state.items.includes(condition.itemId);
    case 'flag': {
      const expected = condition.value ?? true;
      const actual = state.flags[condition.flag] ?? false;
      return actual === expected;
    }
    case 'statAtLeast':
      return state.stats[condition.stat] >= condition.value;
    case 'all':
      return condition.conditions.every((c) => evaluateCondition(c, state));
    case 'any':
      return condition.conditions.some((c) => evaluateCondition(c, state));
    case 'not':
      return !evaluateCondition(condition.condition, state);
  }
}
