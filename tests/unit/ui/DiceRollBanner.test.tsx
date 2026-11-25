import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiceRollBanner } from '../../../src/ui/components/DiceRollBanner';
import type { CheckResult } from '../../../src/engine/checks';

describe('F5.4 – DiceRollBanner', () => {
  it('megjeleníti a dobott kockákat, összeget, küszöböt és siker visszajelzést', () => {
    const result: CheckResult = {
      stat: 'reflex',
      dice: [3, 4],
      total: 7,
      baseStat: 7,
      modifier: 1,
      target: 8,
      success: true,
      cardUsed: null,
      rerolledFrom: null,
    };

    render(<DiceRollBanner result={result} />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent(/Reflex/i);
    expect(region).toHaveTextContent(/3 \+ 4 = 7/);
    expect(region).toHaveTextContent(/8/);
    expect(region).toHaveTextContent(/Siker/i);
  });

  it('kudarcnál és újradobásnál is pontos visszajelzést ad', () => {
    const result: CheckResult = {
      stat: 'kitartas',
      dice: [5, 6],
      total: 11,
      baseStat: 8,
      modifier: 0,
      target: 8,
      success: false,
      cardUsed: 'reroll',
      rerolledFrom: { dice: [6, 5], total: 11 },
    };

    render(<DiceRollBanner result={result} />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent(/Kudarc/i);
    expect(region).toHaveTextContent(/újradobás/i);
  });

  it('autoSuccess kártyánál jelzi az automatikus sikert', () => {
    const result: CheckResult = {
      stat: 'technika',
      dice: null,
      total: null,
      baseStat: 10,
      modifier: 0,
      target: 10,
      success: true,
      cardUsed: 'autoSuccess',
      rerolledFrom: null,
    };

    render(<DiceRollBanner result={result} />);
    expect(screen.getByRole('status')).toHaveTextContent(/automatikus siker/i);
  });
});
