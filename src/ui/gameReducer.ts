import type { CheckResult } from '../engine/checks';
import { applyChoice, createInitialState, useHealCard as applyHealCard } from '../engine/engine';
import { createRng, type RngState } from '../engine/rng';
import type { GameState } from '../engine/schema';
import type { Content } from '../engine/validate';

export type Screen = 'menu' | 'heroSelect' | 'playing';

export interface UiState {
  screen: Screen;
  selectedHeroId: string;
  seedInput: string;
  gameState: GameState | null;
  rng: RngState;
  lastCheck: CheckResult | null;
  error: string | null;
}

export type UiAction =
  | { type: 'GO_MENU' }
  | { type: 'GO_HERO_SELECT' }
  | { type: 'SELECT_HERO'; heroId: string }
  | { type: 'SET_SEED_INPUT'; seed: string }
  | { type: 'START_GAME'; content: Content; fallbackSeed: number }
  | { type: 'CHOOSE'; content: Content; choiceId: string; useCard?: boolean }
  | { type: 'USE_HEAL_CARD'; content: Content }
  | { type: 'LOAD_GAME'; gameState: GameState; rng: RngState }
  | { type: 'CLEAR_ERROR' };

export function createInitialUiState(content: Content): UiState {
  return {
    screen: 'menu',
    selectedHeroId: content.heroes[0]?.id ?? '',
    seedInput: '',
    gameState: null,
    rng: createRng(1),
    lastCheck: null,
    error: null,
  };
}

export function gameReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'GO_MENU':
      return { ...state, screen: 'menu', error: null };
    case 'GO_HERO_SELECT':
      return { ...state, screen: 'heroSelect', error: null };
    case 'SELECT_HERO':
      return { ...state, selectedHeroId: action.heroId };
    case 'SET_SEED_INPUT':
      return { ...state, seedInput: action.seed };
    case 'START_GAME': {
      const heroId = state.selectedHeroId || action.content.heroes[0].id;
      const seedValue =
        state.seedInput.trim() !== '' ? state.seedInput.trim() : action.fallbackSeed;
      return {
        ...state,
        screen: 'playing',
        gameState: createInitialState(action.content, heroId),
        rng: createRng(seedValue),
        lastCheck: null,
        error: null,
      };
    }
    case 'CHOOSE': {
      if (!state.gameState) return state;
      try {
        const res = applyChoice(action.content, state.gameState, action.choiceId, state.rng, {
          useCard: action.useCard,
        });
        return {
          ...state,
          gameState: res.state,
          rng: res.rng,
          lastCheck: res.checkResult,
          error: null,
        };
      } catch (err) {
        return { ...state, error: err instanceof Error ? err.message : 'Hiba történt.' };
      }
    }
    case 'USE_HEAL_CARD': {
      if (!state.gameState) return state;
      try {
        const nextGameState = applyHealCard(action.content, state.gameState);
        return { ...state, gameState: nextGameState, error: null };
      } catch (err) {
        return { ...state, error: err instanceof Error ? err.message : 'Hiba történt.' };
      }
    }
    case 'LOAD_GAME':
      return {
        ...state,
        screen: 'playing',
        gameState: action.gameState,
        rng: action.rng,
        lastCheck: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
  }
}
