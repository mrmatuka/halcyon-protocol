import type { Effect, GameState } from './schema';

/** Egy hatást alkalmaz az állapotra. Tiszta függvény: a bemenet nem változik. */
export function applyEffect(state: GameState, effect: Effect): GameState {
  switch (effect.type) {
    case 'changeStat': {
      const next = state.stats[effect.stat] + effect.delta;
      const upper = effect.stat === 'eletero' ? state.maxHp : Infinity;
      const value = Math.min(upper, Math.max(0, next));
      return { ...state, stats: { ...state.stats, [effect.stat]: value } };
    }
    case 'addItem':
      return state.items.includes(effect.itemId)
        ? { ...state, items: [...state.items] }
        : { ...state, items: [...state.items, effect.itemId] };
    case 'removeItem':
      return { ...state, items: state.items.filter((id) => id !== effect.itemId) };
    case 'setFlag':
      return { ...state, flags: { ...state.flags, [effect.flag]: effect.value ?? true } };
  }
}

/** Sorrendben alkalmaz több hatást. */
export function applyEffects(state: GameState, effects: readonly Effect[]): GameState {
  return effects.reduce(applyEffect, state);
}
