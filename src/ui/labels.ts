import type { CheckStat, Stat } from '../engine/schema';
import type { SlotId } from '../persistence/saveRepository';

export const STAT_LABELS: Record<Stat, string> = {
  reflex: 'Reflex',
  technika: 'Technika',
  kitartas: 'Kitartás',
  szerencse: 'Szerencse',
  eletero: 'Életerő',
};

export const CHECK_STAT_LABELS: Record<CheckStat, string> = {
  reflex: 'Reflex',
  technika: 'Technika',
  kitartas: 'Kitartás',
  szerencse: 'Szerencse',
};

export const SLOT_LABELS: Record<SlotId, string> = {
  autosave: 'Automentés',
  slot1: '1. mentés',
  slot2: '2. mentés',
  slot3: '3. mentés',
};

const englishStats: Record<string, string> = {
  reflex: 'Reflex',
  technika: 'Technology',
  kitartas: 'Endurance',
  szerencse: 'Luck',
  eletero: 'Health',
};

export function fallbackStatLabel(stat: string, locale: 'hu' | 'en'): string {
  const labels = locale === 'hu' ? STAT_LABELS : englishStats;
  return Object.hasOwn(labels, stat) ? labels[stat] : stat;
}

export function slotLabel(slot: SlotId, locale: 'hu' | 'en'): string {
  return locale === 'hu'
    ? SLOT_LABELS[slot]
    : slot === 'autosave'
      ? 'Autosave'
      : `Slot ${slot.slice(-1)}`;
}
