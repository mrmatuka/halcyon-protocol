import type { CheckResult } from '../../engine/checks';
import { CHECK_STAT_LABELS } from '../labels';

export interface DiceRollBannerProps {
  result: CheckResult;
}

export function DiceRollBanner({ result }: DiceRollBannerProps) {
  const statLabel = CHECK_STAT_LABELS[result.stat];
  const modText =
    result.modifier !== 0
      ? ` (${result.baseStat} ${result.modifier > 0 ? '+' : '−'} ${Math.abs(result.modifier)})`
      : '';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`dice-banner ${result.success ? 'dice-banner--success' : 'dice-banner--failure'}`}
    >
      <div className="dice-banner__header">
        <strong>{statLabel}-próba:</strong>{' '}
        <span className="dice-banner__outcome">{result.success ? 'Siker' : 'Kudarc'}</span>
      </div>
      <div className="dice-banner__details">
        {result.cardUsed === 'autoSuccess' ? (
          <span>Képességkártya aktiválva — automatikus siker.</span>
        ) : (
          <>
            <span>
              Dobás:{' '}
              <strong>
                {result.dice![0]} + {result.dice![1]} = {result.total}
              </strong>{' '}
              (célszám: ≤ {result.target}
              {modText})
            </span>
            {result.rerolledFrom && (
              <span className="dice-banner__reroll">
                {' '}
                · Kártya újradobás (első dobás: {result.rerolledFrom.dice[0]} +{' '}
                {result.rerolledFrom.dice[1]} = {result.rerolledFrom.total})
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
