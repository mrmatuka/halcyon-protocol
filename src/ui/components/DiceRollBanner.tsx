import { useLanguage } from '../../platform/language';
import type { CheckResult } from '../../engine/checks';
import { fallbackStatLabel } from '../labels';

export interface DiceRollBannerProps {
  statLabels?: Record<string, string>;
  result: CheckResult;
}

export function DiceRollBanner({ result, statLabels }: DiceRollBannerProps) {
  const { locale, t } = useLanguage();
  const statLabel = statLabels?.[result.stat] ?? fallbackStatLabel(result.stat, locale);
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
        <strong>{t(`${statLabel}-próba:`, `${statLabel} check:`)}</strong>{' '}
        <span className="dice-banner__outcome">
          {result.success ? t('Siker', 'Success') : t('Kudarc', 'Failure')}
        </span>
      </div>
      <div className="dice-banner__details">
        {result.cardUsed === 'autoSuccess' ? (
          <span>
            {t(
              'Képességkártya aktiválva — automatikus siker.',
              'Ability card activated. Automatic success.',
            )}
          </span>
        ) : (
          <>
            <span>
              {t('Dobás:', 'Roll:')}{' '}
              <strong>
                {result.dice![0]} + {result.dice![1]} = {result.total}
              </strong>{' '}
              ({t('célszám:', 'target:')} ≤ {result.target}
              {modText})
            </span>
            {result.rerolledFrom && (
              <span className="dice-banner__reroll">
                {' '}
                · {t('Kártya újradobás (első dobás:', 'Card reroll (first roll:')}{' '}
                {result.rerolledFrom.dice[0]} + {result.rerolledFrom.dice[1]} ={' '}
                {result.rerolledFrom.total})
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
