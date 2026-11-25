import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveLoadModal } from '../../../src/ui/components/SaveLoadModal';
import type { SaveSlotSummary } from '../../../src/persistence/saveRepository';

const slots: SaveSlotSummary[] = [
  {
    slotId: 'autosave',
    status: 'ok',
    metadata: {
      slotId: 'autosave',
      savedAt: '2026-11-25T22:15:00.000Z',
      nodeTitle: 'Zárlat',
      heroName: 'Vass Dóra',
    },
  },
  { slotId: 'slot1', status: 'empty' },
  { slotId: 'slot2', status: 'corrupted', error: 'Sérült mentés' },
  { slotId: 'slot3', status: 'empty' },
];

describe('F5.7 – SaveLoadModal', () => {
  it('megjeleníti a slotokat, metaadatokat, sérült állapotot, és kezeli a mentés/betöltés/törlés műveleteket', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onLoad = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();

    render(
      <SaveLoadModal
        slots={slots}
        canSave={true}
        message={null}
        onSave={onSave}
        onLoad={onLoad}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Vass Dóra/)).toBeInTheDocument();
    expect(screen.getByText(/Zárlat/)).toBeInTheDocument();
    expect(screen.getByText(/Sérült mentés/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Betöltés.*Automentés/i }));
    expect(onLoad).toHaveBeenCalledWith('autosave');

    await user.click(screen.getByRole('button', { name: /Mentés.*1\. mentés/i }));
    expect(onSave).toHaveBeenCalledWith('slot1');

    await user.click(screen.getByRole('button', { name: /Törlés.*2\. mentés/i }));
    expect(onDelete).toHaveBeenCalledWith('slot2');

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
