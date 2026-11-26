import { useLanguage } from '../../platform/language';
import { useEffect, useRef, useState } from 'react';
import type { CheckResult } from '../../engine/checks';
import type { StoryNode } from '../../engine/schema';
import { DiceRollBanner } from './DiceRollBanner';

type EndingNode = Extract<StoryNode, { kind: 'ending' }>;

export interface EndingViewProps {
  statLabels?: Record<string, string>;
  node: EndingNode;
  lastCheck: CheckResult | null;
  imageUrl?: string;
  imageAlt?: string;
  onRestart: () => void;
  onMenu: () => void;
}

export function EndingView({
  node,
  statLabels,
  lastCheck,
  imageUrl,
  imageAlt,
  onRestart,
  onMenu,
}: EndingViewProps) {
  const { t } = useLanguage();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [node.id]);

  const isDeath = node.endingType === 'death';
  const showImage = Boolean(imageUrl && imageUrl !== failedUrl);

  return (
    <article
      className={`scene-card ending-card ${isDeath ? 'ending-card--death' : 'ending-card--victory'}`}
      aria-labelledby="ending-heading"
    >
      <p className="ending-card__tag">
        {isDeath
          ? t('Befejezés · Halál', 'Ending · Death')
          : t('Befejezés · Túlélés', 'Ending · Survival')}
      </p>
      <h1 id="ending-heading" ref={headingRef} tabIndex={-1} className="scene-card__title">
        {node.title}
      </h1>

      <figure className="scene-card__illustration" data-testid="scene-illustration">
        {showImage ? (
          <img
            src={imageUrl}
            alt={imageAlt ?? node.title}
            loading="lazy"
            onError={() => setFailedUrl(imageUrl ?? null)}
          />
        ) : (
          <div className="scene-card__placeholder" role="img" aria-label={imageAlt ?? node.title}>
            <span>
              {t('Illusztráció nem elérhető', 'Illustration unavailable')} · {node.title}
            </span>
          </div>
        )}
      </figure>

      {lastCheck && <DiceRollBanner result={lastCheck} statLabels={statLabels} />}

      <div className="scene-card__text">
        {node.text.split('\n').map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>

      <div className="ending-card__actions">
        <button type="button" className="btn btn--primary" onClick={onRestart}>
          {t('Új játék', 'New game')}
        </button>
        <button type="button" className="btn btn--secondary" onClick={onMenu}>
          {t('Főmenü', 'Main menu')}
        </button>
      </div>
    </article>
  );
}
