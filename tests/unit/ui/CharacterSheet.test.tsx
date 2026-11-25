import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterSheet } from '../../../src/ui/components/CharacterSheet';
import { InventoryPanel } from '../../../src/ui/components/InventoryPanel';
import { sampleHeroes, sampleItems } from '../../fixtures/sampleContent';
import type { GameState, Hero } from '../../../src/engine/schema';

const state: GameState = {
  heroId: 'dora',
  nodeId: 'n01_start',
  stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 6, eletero: 9 },
  maxHp: 12,
  items: ['hopatron'],
  flags: {},
  cardUsed: false,
  endingId: null,
};

describe('F5.5 – CharacterSheet', () => {
  it('megjeleníti az életerőt, a 3 tulajdonságot, a szerencsét és a kártya állapotát', () => {
    render(<CharacterSheet hero={sampleHeroes[0]} state={state} />);

    expect(screen.getByText('Vass Dóra')).toBeInTheDocument();
    expect(screen.getByText('9 / 12')).toBeInTheDocument();
    expect(screen.getByTestId('stat-reflex')).toHaveTextContent('7');
    expect(screen.getByTestId('stat-technika')).toHaveTextContent('10');
    expect(screen.getByTestId('stat-kitartas')).toHaveTextContent('8');
    expect(screen.getByTestId('stat-szerencse')).toHaveTextContent('6');
    expect(screen.getByText('Rövidzár')).toBeInTheDocument();
    expect(screen.getByText(/Elérhető/i)).toBeInTheDocument();
  });

  it('gyógyító kártyánál megjeleníti és hívja a gyógyítás gombot', async () => {
    const user = userEvent.setup();
    const onHeal = vi.fn();
    const lili: Hero = {
      ...sampleHeroes[0],
      id: 'lili',
      name: 'Dr. Imre Lili',
      card: {
        id: 'stimulator',
        name: 'Stimulátor',
        description: '+5 Életerő',
        options: [{ type: 'heal', amount: 5 }],
      },
    };

    render(<CharacterSheet hero={lili} state={state} onUseHealCard={onHeal} />);
    await user.click(screen.getByRole('button', { name: /Gyógyítás/i }));
    expect(onHeal).toHaveBeenCalledTimes(1);
  });
});

describe('F5.6 – InventoryPanel', () => {
  it('megjeleníti a birtokolt tárgyakat', () => {
    render(<InventoryPanel itemIds={['hopatron']} allItems={sampleItems} />);
    expect(screen.getByText('Hőpatron')).toBeInTheDocument();
    expect(screen.getByText('Fűti a kezed.')).toBeInTheDocument();
  });

  it('üres tárgylistánál jelzi, hogy nincs tárgy', () => {
    render(<InventoryPanel itemIds={[]} allItems={sampleItems} />);
    expect(screen.getByText(/Nincs nálad tárgy/i)).toBeInTheDocument();
  });
});
