import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../../src/ui/App';
import { LocalStorageSaveRepository } from '../../../src/persistence/localStorageSaveRepository';
import { sampleHeroes, sampleItems, sampleStory } from '../../fixtures/sampleContent';
import { createRng, roll2D6 } from '../../../src/engine/rng';

const content = { heroes: sampleHeroes, items: sampleItems, story: sampleStory };

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  };
}

function findSeedForTotal(predicate: (t: number) => boolean): string {
  for (let s = 1; s < 5000; s++) {
    if (predicate(roll2D6(createRng(String(s))).total)) return String(s);
  }
  throw new Error('Nem található seed');
}

describe('F5.1, F5.8, F5.9 – App teljes folyamat, befejezés és hozzáférhetőség', () => {
  it('főmenü → hősválasztás → játék → próba → befejezés → újrakezdés', async () => {
    const user = userEvent.setup();
    const repo = new LocalStorageSaveRepository(createMemoryStorage());
    const winSeed = findSeedForTotal((t) => t <= 8);

    render(<App content={content} saveRepository={repo} />);

    // Főmenü
    expect(screen.getByRole('heading', { level: 1, name: 'Csendes Jel' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Új játék' }));

    // Hősválasztás + seed
    const seedInput = screen.getByLabelText(/Seed/i);
    await user.clear(seedInput);
    await user.type(seedInput, winSeed);
    await user.click(screen.getByRole('button', { name: /Vass Dóra/i }));
    await user.click(screen.getByRole('button', { name: 'Kaland indítása' }));

    // Első jelenet
    const sceneHeading = screen.getByRole('heading', { name: 'Kezdet' });
    expect(sceneHeading).toBeInTheDocument();
    expect(document.activeElement).toBe(sceneHeading); // F5.9 fókuszkezelés

    // Választás -> Zárlat (Hőpatron bekerül a tárgylistába)
    await user.click(screen.getByRole('button', { name: /Bemész/i }));
    expect(screen.getByRole('heading', { name: 'Zárlat' })).toBeInTheDocument();
    expect(screen.getByText('Hőpatron')).toBeInTheDocument();

    // Próba -> Befejezés (E1)
    await user.click(screen.getByRole('button', { name: /Futsz/i }));
    expect(screen.getByRole('heading', { name: 'Siker' })).toBeInTheDocument();
    expect(screen.getByText(/Befejezés/i)).toBeInTheDocument();

    // Újrakezdés
    await user.click(screen.getByRole('button', { name: 'Új játék' }));
    expect(screen.getByRole('heading', { name: /Válassz hőst/i })).toBeInTheDocument();
  });

  it('mentés és betöltés a felületen keresztül', async () => {
    const user = userEvent.setup();
    const repo = new LocalStorageSaveRepository(createMemoryStorage());

    render(<App content={content} saveRepository={repo} />);
    await user.click(screen.getByRole('button', { name: 'Új játék' }));
    await user.click(screen.getByRole('button', { name: 'Kaland indítása' }));
    await user.click(screen.getByRole('button', { name: /Bemész/i }));

    // Mentés 1. slotba
    await user.click(screen.getByRole('button', { name: /Mentés \/ Betöltés/i }));
    await user.click(screen.getByRole('button', { name: /Mentés.*1\. mentés/i }));
    expect(await screen.findByText(/Mentve/i)).toBeInTheDocument();

    // Bezárás, főmenü, majd betöltés
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Főmenü' }));
    await user.click(screen.getByRole('button', { name: 'Betöltés' }));
    await user.click(screen.getByRole('button', { name: /Betöltés.*1\. mentés/i }));

    expect(await screen.findByRole('heading', { name: 'Zárlat' })).toBeInTheDocument();
  });
});
