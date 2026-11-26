import { useLanguage } from '../../platform/language';
import { useEffect, useRef, useState } from 'react';
import type { CheckResult } from '../../engine/checks';
import type { Choice, StoryNode } from '../../engine/schema';
import { fallbackStatLabel } from '../labels';
import { ComicIcon } from './ComicIcon';
import { DiceRollBanner } from './DiceRollBanner';

type SceneNode = Extract<StoryNode, { kind: 'scene' }>;

export interface SceneViewProps {
  statLabels?: Record<string, string>;
  node: SceneNode;
  choices: Choice[];
  canUseCard: (choiceId: string) => boolean;
  cardName?: string;
  lastCheck: CheckResult | null;
  imageUrl?: string;
  imageAlt?: string;
  onChoose: (choiceId: string, useCard: boolean) => void;
}

export function SceneView({
  node,
  statLabels,
  choices,
  canUseCard,
  cardName,
  lastCheck,
  imageUrl,
  imageAlt,
  onChoose,
}: SceneViewProps) {
  const { locale, t } = useLanguage();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [node.id]);

  const showImage = Boolean(imageUrl && imageUrl !== failedUrl);

  return (
    <article className="scene-card" aria-labelledby="scene-heading">
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

      <h1 id="scene-heading" ref={headingRef} tabIndex={-1} className="scene-card__title">
        {node.title}
      </h1>

      {lastCheck && <DiceRollBanner result={lastCheck} statLabels={statLabels} />}

      <div className="scene-card__text">
        {node.text.split('\n').map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>

      <section className="choices" aria-label={t('Választási lehetőségek', 'Choices')}>
        {choices.map((choice) => {
          const isCheck = 'check' in choice;
          const cardEligible = canUseCard(choice.id);

          return (
            <div key={choice.id} className="choice-row">
              <button
                type="button"
                className="btn btn--choice"
                onClick={() => onChoose(choice.id, false)}
              >
                <ComicIcon name={choice.id === 'toronyba' ? 'steps' : /vissza|return/.test(choice.id) ? 'turn' : 'next'} />
                <span className="comic-choice-label">{choice.text}</span>
                {isCheck && (
                  <span className="badge badge--check">
                    2d6 ≤{' '}
                    {statLabels?.[choice.check.stat] ??
                      fallbackStatLabel(choice.check.stat, locale)}
                  </span>
                )}
                <ComicIcon name="next" />
              </button>
              {cardEligible && (
                <button
                  type="button"
                  className="btn btn--card"
                  onClick={() => onChoose(choice.id, true)}
                >
                  {t('Kártya:', 'Card:')} {cardName ?? t('Képesség', 'Ability')}
                </button>
              )}
            </div>
          );
        })}
      </section>
    </article>
  );
}
