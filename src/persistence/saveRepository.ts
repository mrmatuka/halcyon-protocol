import type { RngState } from '../engine/rng';
import type { GameState } from '../engine/schema';

export const AUTOSAVE_SLOT_ID = 'autosave' as const;
export const MANUAL_SLOT_IDS = ['slot1', 'slot2', 'slot3'] as const;
export const ALL_SLOT_IDS = [AUTOSAVE_SLOT_ID, ...MANUAL_SLOT_IDS] as const;

export type SlotId = (typeof ALL_SLOT_IDS)[number];

export interface SaveMetadata {
  slotId: SlotId;
  savedAt: string;
  nodeTitle: string;
  heroName: string;
}

export interface SaveInputMetadata {
  nodeTitle: string;
  heroName: string;
  savedAt?: string;
}

export type SaveSlotSummary =
  | { slotId: SlotId; status: 'empty' }
  | { slotId: SlotId; status: 'ok'; metadata: SaveMetadata }
  | { slotId: SlotId; status: 'corrupted'; error: string };

export interface LoadedSave {
  state: GameState;
  rng: RngState;
  metadata: SaveMetadata;
}

export type SaveErrorCode = 'NOT_FOUND' | 'CORRUPTED' | 'UNSUPPORTED_VERSION' | 'QUOTA_EXCEEDED';

export class SaveError extends Error {
  readonly code: SaveErrorCode;

  constructor(code: SaveErrorCode, message: string) {
    super(message);
    this.name = 'SaveError';
    this.code = code;
  }
}

/**
 * Cserélhető mentési réteg interfész (localStorage vagy későbbi szerveroldali tárolás).
 */
export interface SaveRepository {
  save(
    slotId: SlotId,
    state: GameState,
    rng: RngState,
    meta: SaveInputMetadata,
  ): Promise<SaveMetadata>;
  load(slotId: SlotId): Promise<LoadedSave>;
  delete(slotId: SlotId): Promise<void>;
  listSlots(): Promise<SaveSlotSummary[]>;
}
