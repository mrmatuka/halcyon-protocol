import { useId } from 'react';
import type { GameState, StoryNode } from '../../engine/schema';
import { useLanguage } from '../../platform/language';
import { ComicIcon } from './ComicIcon';

export function AdventureProgress({
  state,
  nodes,
  onOpenMap,
}: {
  state: GameState;
  nodes: StoryNode[];
  onOpenMap?: () => void;
}) {
  const { t } = useLanguage();
  const labelId = useId();
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const route = state.route?.nodeIds ?? [state.nodeId];
  const partial = state.route?.partial ?? true;
  const total = nodes.filter((node) => node.kind === 'scene').length;
  const visited = [...new Set(route)].filter((id) => byId.get(id)?.kind === 'scene').length;
  const showMap = onOpenMap === undefined;

  return (
    <section className="adventure-progress" aria-labelledby={labelId}>
      {showMap && <h2>{t('Bejárt útvonal', 'Route map')}</h2>}
      <div className="adventure-progress__summary">
        <div className="adventure-progress__meter">
          <span id={labelId}>
            {partial
              ? t('Rögzített jelenetek', 'Scenes recorded')
              : t('Felfedezett jelenetek', 'Scenes discovered')}{' '}
            ·{' '}
            <strong>
              {visited} / {total}
            </strong>
          </span>
          {total > 0 && (
            <progress
              aria-labelledby={labelId}
              aria-valuetext={t(
                `${visited} a(z) ${total} jelenetből`,
                `${visited} of ${total} scenes`,
              )}
              value={visited}
              max={total}
            />
          )}
        </div>
        {onOpenMap && (
          <button type="button" className="btn btn--secondary" onClick={onOpenMap}>
            <ComicIcon name="map" /> {t('Térkép', 'Map')}
          </button>
        )}
      </div>
      {showMap && (
        <>
          {state.endingId !== null && <p>{t('Befejezés elérve', 'Ending reached')}</p>}
          {partial && (
            <p className="muted">
              {t(
                'Régi mentésből folytatod. A térkép a betöltött helyszíntől mutatja az útvonalat.',
                'You continued an older save. The map shows your route from the loaded location.',
              )}
            </p>
          )}
          <ol
            className="adventure-route"
            role="list"
            reversed
            aria-label={t('Útvonal, legutóbbi helyszín felül', 'Route, latest location first')}
          >
            {route
              .slice()
              .reverse()
              .map((id, index) => (
                <li key={route.length - index} aria-current={index === 0 ? 'step' : undefined}>
                  <span>{byId.get(id)?.title ?? t('Korábbi helyszín', 'Earlier location')}</span>
                  {index === 0 && <strong>{t('Itt tartasz', 'You are here')}</strong>}
                </li>
              ))}
          </ol>
        </>
      )}
    </section>
  );
}
