import { useLanguage } from '../../platform/language';
import { useEffect } from 'react';
import {
  AUTOSAVE_SLOT_ID,
  type SaveSlotSummary,
  type SlotId,
} from '../../persistence/saveRepository';
import { slotLabel } from '../labels';

export interface SaveLoadModalProps {
  slots: SaveSlotSummary[];
  canSave: boolean;
  message: string | null;
  onSave: (slotId: SlotId) => void;
  onLoad: (slotId: SlotId) => void;
  onDelete: (slotId: SlotId) => void;
  onClose: () => void;
}

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(locale);
}

export function SaveLoadModal({
  slots,
  canSave,
  message,
  onSave,
  onLoad,
  onDelete,
  onClose,
}: SaveLoadModalProps) {
  const { locale, t } = useLanguage();
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-modal-title"
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="save-modal-title">{t('Mentés és betöltés', 'Save and load')}</h2>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            {t('Bezárás', 'Close')}
          </button>
        </div>

        {message && (
          <p role="status" aria-live="polite" className="modal__message">
            {message}
          </p>
        )}

        <ul className="slot-list">
          {slots.map((slot) => {
            const label = slotLabel(slot.slotId, locale);
            const isManual = slot.slotId !== AUTOSAVE_SLOT_ID;

            return (
              <li key={slot.slotId} className="slot-item">
                <div className="slot-item__info">
                  <strong>{label}</strong>
                  {slot.status === 'empty' && <span className="muted">{t('Üres', 'Empty')}</span>}
                  {slot.status === 'ok' && (
                    <span>
                      {slot.metadata.heroName} – {slot.metadata.nodeTitle} ·{' '}
                      {formatDate(slot.metadata.savedAt, locale)}
                    </span>
                  )}
                  {slot.status === 'corrupted' && <span className="error-text">{slot.error}</span>}
                </div>
                <div className="slot-item__actions">
                  {canSave && isManual && (
                    <button
                      type="button"
                      className="btn btn--primary"
                      aria-label={`${t('Mentés:', 'Save:')} ${label}`}
                      onClick={() => onSave(slot.slotId)}
                    >
                      {t('Mentés', 'Save')}
                    </button>
                  )}
                  {slot.status === 'ok' && (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      aria-label={`${t('Betöltés:', 'Load:')} ${label}`}
                      onClick={() => onLoad(slot.slotId)}
                    >
                      {t('Betöltés', 'Load')}
                    </button>
                  )}
                  {slot.status !== 'empty' && (
                    <button
                      type="button"
                      className="btn btn--danger"
                      aria-label={`${t('Törlés:', 'Delete:')} ${label}`}
                      onClick={() => onDelete(slot.slotId)}
                    >
                      {t('Törlés', 'Delete')}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
