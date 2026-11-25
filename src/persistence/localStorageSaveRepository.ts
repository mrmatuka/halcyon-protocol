import { z } from 'zod';
import type { RngState } from '../engine/rng';
import type { GameState } from '../engine/schema';
import { SAVE_FORMAT_VERSION, deserializeGame, serializeGame } from '../engine/serialization';
import {
  ALL_SLOT_IDS,
  SaveError,
  type LoadedSave,
  type SaveInputMetadata,
  type SaveMetadata,
  type SaveRepository,
  type SaveSlotSummary,
  type SlotId,
} from './saveRepository';

const storedEnvelopeSchema = z.strictObject({
  metadata: z.strictObject({
    savedAt: z.string().min(1),
    nodeTitle: z.string().min(1),
    heroName: z.string().min(1),
  }),
  payload: z.string().min(1),
});

export interface LocalStorageSaveRepositoryOptions {
  keyPrefix?: string;
  now?: () => string;
}

const DEFAULT_KEY_PREFIX = 'kalandjatek:save:';

function isQuotaError(err: unknown): boolean {
  if (err instanceof DOMException) {
    return (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014
    );
  }
  return false;
}

export class LocalStorageSaveRepository implements SaveRepository {
  private readonly storage: Storage;
  private readonly keyPrefix: string;
  private readonly now: () => string;

  constructor(
    storage: Storage = globalThis.localStorage,
    options?: LocalStorageSaveRepositoryOptions,
  ) {
    this.storage = storage;
    this.keyPrefix = options?.keyPrefix ?? DEFAULT_KEY_PREFIX;
    this.now = options?.now ?? (() => new Date().toISOString());
  }

  private key(slotId: SlotId): string {
    return `${this.keyPrefix}${slotId}`;
  }

  private parseSlot(slotId: SlotId, raw: string): LoadedSave {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      throw new SaveError('CORRUPTED', `A(z) „${slotId}" mentési slot sérült (érvénytelen JSON).`);
    }

    const envelope = storedEnvelopeSchema.safeParse(parsedJson);
    if (!envelope.success) {
      throw new SaveError('CORRUPTED', `A(z) „${slotId}" mentési slot szerkezete sérült.`);
    }

    let payloadObj: unknown;
    try {
      payloadObj = JSON.parse(envelope.data.payload);
    } catch {
      throw new SaveError('CORRUPTED', `A(z) „${slotId}" mentési adat sérült.`);
    }

    if (
      typeof payloadObj === 'object' &&
      payloadObj !== null &&
      'version' in payloadObj &&
      (payloadObj as { version: unknown }).version !== SAVE_FORMAT_VERSION
    ) {
      throw new SaveError(
        'UNSUPPORTED_VERSION',
        `A(z) „${slotId}" mentés verziója nem támogatott (várt: ${SAVE_FORMAT_VERSION}).`,
      );
    }

    try {
      const { state, rng } = deserializeGame(envelope.data.payload);
      return {
        state,
        rng,
        metadata: {
          slotId,
          ...envelope.data.metadata,
        },
      };
    } catch {
      throw new SaveError('CORRUPTED', `A(z) „${slotId}" mentés játékállapota érvénytelen.`);
    }
  }

  async save(
    slotId: SlotId,
    state: GameState,
    rng: RngState,
    meta: SaveInputMetadata,
  ): Promise<SaveMetadata> {
    const metadata: SaveMetadata = {
      slotId,
      savedAt: meta.savedAt ?? this.now(),
      nodeTitle: meta.nodeTitle,
      heroName: meta.heroName,
    };
    const payload = serializeGame(state, rng);
    const envelope = JSON.stringify({
      metadata: {
        savedAt: metadata.savedAt,
        nodeTitle: metadata.nodeTitle,
        heroName: metadata.heroName,
      },
      payload,
    });

    try {
      this.storage.setItem(this.key(slotId), envelope);
    } catch (err) {
      if (isQuotaError(err)) {
        throw new SaveError(
          'QUOTA_EXCEEDED',
          'A böngésző tárhelye megtelt, a mentés nem sikerült.',
        );
      }
      throw err;
    }

    return metadata;
  }

  async load(slotId: SlotId): Promise<LoadedSave> {
    const raw = this.storage.getItem(this.key(slotId));
    if (raw === null) {
      throw new SaveError('NOT_FOUND', `A(z) „${slotId}" mentési slot üres.`);
    }
    return this.parseSlot(slotId, raw);
  }

  async delete(slotId: SlotId): Promise<void> {
    this.storage.removeItem(this.key(slotId));
  }

  async listSlots(): Promise<SaveSlotSummary[]> {
    return ALL_SLOT_IDS.map((slotId): SaveSlotSummary => {
      const raw = this.storage.getItem(this.key(slotId));
      if (raw === null) {
        return { slotId, status: 'empty' };
      }
      try {
        const loaded = this.parseSlot(slotId, raw);
        return { slotId, status: 'ok', metadata: loaded.metadata };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sérült mentés.';
        return { slotId, status: 'corrupted', error: message };
      }
    });
  }
}
