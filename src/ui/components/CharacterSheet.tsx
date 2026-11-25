import type { GameState, Hero } from '../../engine/schema';
import { STAT_LABELS } from '../labels';

export interface CharacterSheetProps {
  hero: Hero;
  state: GameState;
  onUseHealCard?: () => void;
}

export function CharacterSheet({ hero, state, onUseHealCard }: CharacterSheetProps) {
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
    <section className="panel" aria-label="Karakterlap">
      <h2 className="panel__title">Karakterlap</h2>
      <div className="hero-meta">
        <strong className="hero-meta__name">{hero.name}</strong>
        <span className="hero-meta__role">{hero.role}</span>
      </div>

      <div className="hp-block">
        <div className="hp-block__row">
          <span>{STAT_LABELS.eletero}</span>
          <strong>
            {state.stats.eletero} / {state.maxHp}
          </strong>
        </div>
        <div
          className="hp-bar"
          role="progressbar"
          aria-label="Életerő"
          aria-valuenow={state.stats.eletero}
          aria-valuemin={0}
          aria-valuemax={state.maxHp}
        >
          <div className="hp-bar__fill" style={{ width: `${hpPercent}%` }} />
        </div>
      </div>

      <dl className="stat-grid">
        {(['reflex', 'technika', 'kitartas', 'szerencse'] as const).map((stat) => (
          <div key={stat} className="stat-box" data-testid={`stat-${stat}`}>
            <dt>{STAT_LABELS[stat]}</dt>
            <dd>{state.stats[stat]}</dd>
          </div>
        ))}
      </dl>

      <div className="card-box">
        <div className="card-box__header">
          <strong>{hero.card.name}</strong>
          <span className={`badge ${state.cardUsed ? 'badge--muted' : 'badge--accent'}`}>
            {state.cardUsed ? 'Elhasználva' : 'Elérhető'}
          </span>
        </div>
        <p className="card-box__desc">{hero.card.description}</p>
        {canHeal && healOpt.type === 'heal' && (
          <button type="button" className="btn btn--card" onClick={onUseHealCard}>
            Gyógyítás (+{healOpt.amount} Életerő)
          </button>
        )}
      </div>
    </section>
  );
}
