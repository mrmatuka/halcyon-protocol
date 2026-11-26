import { portraitUrl } from '../../platform/portraits';
import { useLanguage } from '../../platform/language';
import type { GameState, Hero } from '../../engine/schema';
import { fallbackStatLabel } from '../labels';

export interface CharacterSheetProps {
  statLabels?: Record<string, string>;
  hero: Hero;
  state: GameState;
  onUseHealCard?: () => void;
}

export function CharacterSheet({ hero, state, onUseHealCard, statLabels }: CharacterSheetProps) {
  const { locale, t } = useLanguage();
  const healOpt = hero.card.options.find((o) => o.type === 'heal');
  const canHeal =
    healOpt !== undefined &&
    !state.cardUsed &&
    state.endingId === null &&
    onUseHealCard !== undefined;
  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((state.stats.eletero / state.maxHp) * 100)),
  );

  return (
    <section className="panel" aria-label={t('Karakterlap', 'Character sheet')}>
      <h2 className="panel__title">{t('Karakterlap', 'Character sheet')}</h2>
      <div className="hero-meta">
        {hero.portrait && (
          <img src={portraitUrl(hero.portrait)} className="profile-portrait" alt="" />
        )}
        <strong className="hero-meta__name">{hero.name}</strong>
        <span className="hero-meta__role">{hero.role}</span>
      </div>

      <div className="hp-block">
        <div className="hp-block__row">
          <span>{fallbackStatLabel('eletero', locale)}</span>
          <strong>
            {state.stats.eletero} / {state.maxHp}
          </strong>
        </div>
        <div
          className="hp-bar"
          role="progressbar"
          aria-label={fallbackStatLabel('eletero', locale)}
          aria-valuenow={state.stats.eletero}
          aria-valuemin={0}
          aria-valuemax={state.maxHp}
        >
          <div className="hp-bar__fill" style={{ width: `${hpPercent}%` }} />
        </div>
      </div>

      <dl className="stat-grid">
        {Object.keys(state.stats)
          .filter((stat) => stat !== 'eletero')
          .map((stat) => (
            <div key={stat} className="stat-box" data-testid={`stat-${stat}`}>
              <dt>{statLabels?.[stat] ?? fallbackStatLabel(stat, locale)}</dt>
              <dd>{state.stats[stat]}</dd>
            </div>
          ))}
      </dl>

      <div className="card-box">
        <div className="card-box__header">
          <strong>{hero.card.name}</strong>
          <span className={`badge ${state.cardUsed ? 'badge--muted' : 'badge--accent'}`}>
            {state.cardUsed ? t('Elhasználva', 'Used') : t('Elérhető', 'Available')}
          </span>
        </div>
        <p className="card-box__desc">{hero.card.description}</p>
        {canHeal && healOpt.type === 'heal' && (
          <button type="button" className="btn btn--card" onClick={onUseHealCard}>
            {t('Gyógyítás', 'Heal')} (+{healOpt.amount} {fallbackStatLabel('eletero', locale)})
          </button>
        )}
      </div>
    </section>
  );
}
