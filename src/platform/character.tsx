import { useState } from 'react';
import type { Hero } from '../engine/schema';
import { localizedLabel, type AdventureManifest } from './adventure';
import { useLanguage } from './language';

const pointBudget = 3;

export function CharacterCreator({
  heroes,
  manifest,
  onCreate,
}: {
  heroes: Hero[];
  manifest: AdventureManifest;
  onCreate: (hero: Hero) => void;
}) {
  const { locale, t } = useLanguage();
  const [name, setName] = useState('');
  const [archetypeId, setArchetypeId] = useState(heroes[0].id);
  const [points, setPoints] = useState<Record<string, number>>({});
  const archetype = heroes.find(({ id }) => id === archetypeId) ?? heroes[0];
  const stats = Object.entries(manifest.statLabels).filter(([stat]) => stat !== 'eletero');
  const available = pointBudget - Object.values(points).reduce((sum, value) => sum + value, 0);
  return (
    <fieldset className="platform-fields">
      <legend>{t('Saját karakter', 'Custom character')}</legend>
      <label>
        {t('Név', 'Name')}{' '}
        <input maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        {t('Archetípus', 'Archetype')}{' '}
        <select
          value={archetypeId}
          onChange={(event) => {
            setArchetypeId(event.target.value);
            setPoints({});
          }}
        >
          {heroes.map((hero) => (
            <option key={hero.id} value={hero.id}>
              {hero.role || hero.name}
            </option>
          ))}
        </select>
      </label>
      {stats.length > 0 && (
        <p>
          {t('Elosztható pontok', 'Points remaining')} {available}
        </p>
      )}
      {stats.map(([key, label]) => {
        const allocated = points[key] ?? 0;
        return (
          <label key={key}>
            {localizedLabel(label, locale)} ({archetype.stats[key] + allocated})
            <input
              type="number"
              min={0}
              max={allocated + available}
              value={allocated}
              onChange={(event) =>
                setPoints({
                  ...points,
                  [key]: Math.max(
                    0,
                    Math.min(allocated + available, parseInt(event.target.value, 10) || 0),
                  ),
                })
              }
            />
          </label>
        );
      })}
      <button
        type="button"
        className="btn btn--primary"
        disabled={!name.trim()}
        onClick={() => {
          const stats = { ...archetype.stats };
          for (const [stat, bonus] of Object.entries(points)) stats[stat] += bonus;
          onCreate({ ...archetype, id: 'custom_hero', name: name.trim(), stats });
        }}
      >
        {t('Karakter használata', 'Use character')}
      </button>
    </fieldset>
  );
}
