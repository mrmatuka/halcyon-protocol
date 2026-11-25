import { z } from 'zod';
import { rngStateSchema, type RngState } from './rng';
import { gameStateSchema, type GameState } from './schema';

export const SAVE_FORMAT_VERSION = 1 as const;

export const serializedSaveSchema = z.strictObject({
  version: z.number().int(),
  state: gameStateSchema,
  rng: rngStateSchema,
});

export type SerializedSave = z.infer<typeof serializedSaveSchema>;

/** Szerializálja a játékállapotot és az RNG-állapotot verziózott JSON szöveggé. */
export function serializeGame(state: GameState, rng: RngState): string {
  const payload: SerializedSave = {
    version: SAVE_FORMAT_VERSION,
    state: gameStateSchema.parse(state),
    rng: rngStateSchema.parse(rng),
  };
  return JSON.stringify(payload);
}

/** Visszaállítja a játékállapotot és az RNG-állapotot JSON szövegből. */
export function deserializeGame(json: string): { state: GameState; rng: RngState } {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Érvénytelen JSON mentés.');
  }
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('version' in raw) ||
    (raw as { version: unknown }).version !== SAVE_FORMAT_VERSION
  ) {
    throw new Error(`Nem támogatott vagy hiányzó mentési verzió (várt: ${SAVE_FORMAT_VERSION}).`);
  }
  const parsed = serializedSaveSchema.parse(raw);
  return { state: parsed.state, rng: parsed.rng };
}
