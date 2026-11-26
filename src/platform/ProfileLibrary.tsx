import { useState, type FormEvent } from 'react';
import { localizedLabel } from './adventure';
import type { CatalogEntry } from './catalog';
import { useLanguage } from './language';
import { portraitUrl, uploadPortrait } from './portraits';
import {
  assignedProfile,
  attributeCap,
  attributeLabels,
  attributes,
  attributeValue,
  blankPoints,
  classIds,
  classes,
  pointBudget,
  rollPoints,
  spentPoints,
  traitIds,
  traits,
  type Profile,
  type Profiles,
} from './profiles';

const sampleNames = ['Mira', 'Ari', 'Elin', 'Soren', 'Noor', 'Tarin', 'Veda', 'Kael'];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function blankProfile(): Profile {
  return {
    id: `profile_${crypto.randomUUID().replaceAll('-', '')}`,
    name: '',
    classId: 'scout',
    traitId: 'nimble',
    points: { ...blankPoints },
    portrait: 'preset:scout-1',
  };
}

export function ProfileLibrary({
  library,
  adventures,
  onChange,
}: {
  library: Profiles;
  adventures: CatalogEntry[];
  onChange: (next: Profiles) => void;
}) {
  const { locale, t } = useLanguage();
  const [draft, setDraft] = useState<Profile>();
  const [removeId, setRemoveId] = useState<string>();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  function change(next: Profiles, onSuccess?: () => void) {
    try {
      onChange(next);
      setError('');
      onSuccess?.();
    } catch {
      setError(
        t(
          'A karaktertár mentése nem sikerült. Ellenőrizd a böngésző tárhelyét.',
          'Could not save the character library. Check browser storage.',
        ),
      );
    }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!draft?.name.trim() || uploading) return;
    const character = { ...draft, name: draft.name.trim() };
    const found = library.profiles.some(({ id }) => character.id === id);
    change(
      {
        ...library,
        profiles: found
          ? library.profiles.map((profile) => (profile.id === character.id ? character : profile))
          : [...library.profiles, character],
        defaultId: library.defaultId ?? character.id,
      },
      () => setDraft(undefined),
    );
  }

  return (
    <main className="app-shell">
      <div className="library-header">
        <div>
          <h1>{t('Karakterek', 'Characters')}</h1>
          <p className="muted">
            {t(
              'Egy közös karaktertár minden kalandhoz.',
              'One character library for all adventures.',
            )}
          </p>
        </div>
        <button
          className="btn btn--primary"
          type="button"
          disabled={uploading}
          onClick={() => {
            setError('');
            setDraft(blankProfile());
          }}
        >
          {t('Új karakter', 'New character')}
        </button>
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {draft && (
        <form className="platform-fields character-form" onSubmit={save}>
          <h2>{t('Karaktergenerátor', 'Character creator')}</h2>
          <button
            className="btn btn--secondary"
            type="button"
            disabled={uploading}
            onClick={() => {
              const classId = pick(classIds);
              const traitId = pick(traitIds);
              setDraft({
                ...draft,
                name: pick(sampleNames),
                classId,
                traitId,
                points: rollPoints({ classId, traitId }),
                portrait: `preset:${classId}-${pick([1, 2])}`,
              });
            }}
          >
            {t('Véletlen karakter', 'Random character')}
          </button>
          <label className="editor-field">
            {t('Név', 'Name')}
            <input
              required
              maxLength={60}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <div className="character-selects">
            <label className="editor-field">
              {t('Kaszt', 'Class')}
              <select
                value={draft.classId}
                onChange={(e) => {
                  const classId = e.target.value as Profile['classId'];
                  setDraft({
                    ...draft,
                    classId,
                    points: { ...blankPoints },
                    portrait: draft.portrait.startsWith('preset:')
                      ? `preset:${classId}-1`
                      : draft.portrait,
                  });
                }}
              >
                {classIds.map((id) => (
                  <option value={id} key={id}>
                    {classes[id][locale]}
                  </option>
                ))}
              </select>
            </label>
            <label className="editor-field">
              {t('Egyéni adottság', 'Personal trait')}
              <select
                value={draft.traitId}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    traitId: e.target.value as Profile['traitId'],
                    points: { ...blankPoints },
                  })
                }
              >
                {traitIds.map((id) => (
                  <option value={id} key={id}>
                    {traits[id][locale]} (+1 {attributeLabels[traits[id].stat][locale]})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p>
            {t('Kasztképesség', 'Class ability')}:{' '}
            <strong>{classes[draft.classId].ability[locale]}</strong>
          </p>
          <div className="topbar__actions">
            <p>
              {t('Elosztható pontok', 'Points remaining')}:{' '}
              <strong>{pointBudget - spentPoints(draft.points)}</strong>
            </p>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => setDraft({ ...draft, points: rollPoints(draft) })}
            >
              {t('Pontok sorsolása', 'Roll attributes')}
            </button>
          </div>
          <div className="profile-attributes">
            {attributes.map((stat) => {
              const max = Math.min(
                attributeCap - attributeValue({ ...draft, points: blankPoints }, stat),
                draft.points[stat] + pointBudget - spentPoints(draft.points),
              );
              return (
                <label className="editor-field" key={stat}>
                  {attributeLabels[stat][locale]}{' '}
                  <strong>
                    {attributeValue(draft, stat)} / {attributeCap}
                  </strong>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={draft.points[stat]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        points: {
                          ...draft.points,
                          [stat]: Math.max(
                            0,
                            Math.min(max, Number.parseInt(e.target.value, 10) || 0),
                          ),
                        },
                      })
                    }
                  />
                </label>
              );
            })}
          </div>
          <div className="topbar__actions">
            <img className="profile-portrait" src={portraitUrl(draft.portrait)} alt="" />
            <button
              className="btn btn--secondary"
              type="button"
              disabled={uploading}
              onClick={() => {
                const first = `preset:${draft.classId}-1`;
                setDraft({
                  ...draft,
                  portrait: draft.portrait === first ? `preset:${draft.classId}-2` : first,
                });
              }}
            >
              {t('Kasztportré cseréje', 'Change class portrait')}
            </button>
            <label className="btn btn--secondary zip-upload">
              {t('Saját portré feltöltése', 'Upload portrait')}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  setUploading(true);
                  try {
                    const portrait = await uploadPortrait(file);
                    setDraft((current) =>
                      current?.id === draft.id ? { ...current, portrait } : current,
                    );
                    setError('');
                  } catch (err) {
                    setError(String(err));
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
          </div>
          <div className="topbar__actions">
            <button
              className="btn btn--primary"
              type="submit"
              disabled={uploading || !draft.name.trim()}
            >
              {t('Karakter mentése', 'Save character')}
            </button>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => setDraft(undefined)}
            >
              {t('Mégse', 'Cancel')}
            </button>
          </div>
        </form>
      )}
      <div className="profile-grid">
        {library.profiles.map((profile) => (
          <article className="platform-fields" key={profile.id}>
            <div className="profile-title">
              <img className="profile-portrait" src={portraitUrl(profile.portrait)} alt="" />
              <div>
                <h2>{profile.name}</h2>
                <p>
                  {classes[profile.classId][locale]} · {traits[profile.traitId][locale]}
                </p>
              </div>
            </div>
            <div className="topbar__actions">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={profile.id === library.defaultId}
                onClick={() => change({ ...library, defaultId: profile.id })}
              >
                {profile.id === library.defaultId
                  ? t('Alapértelmezett', 'Default')
                  : t('Legyen alapértelmezett', 'Make default')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={uploading}
                onClick={() => setDraft(profile)}
              >
                {t('Szerkesztés', 'Edit')}
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => setRemoveId(profile.id)}
              >
                {t('Törlés', 'Delete')}
              </button>
            </div>
            {removeId === profile.id && (
              <div className="topbar__actions">
                <p>
                  {t(
                    'Törlöd a karaktert a karaktertárból?',
                    'Remove this character from the library?',
                  )}
                </p>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => {
                    const profiles = library.profiles.filter(({ id }) => id !== profile.id);
                    const assignments = Object.fromEntries(
                      Object.entries(library.assignments).filter(([, id]) => id !== profile.id),
                    );
                    change(
                      {
                        ...library,
                        profiles,
                        assignments,
                        defaultId:
                          library.defaultId === profile.id
                            ? (profiles[0]?.id ?? null)
                            : library.defaultId,
                      },
                      () => {
                        setRemoveId(undefined);
                        if (draft?.id === profile.id) setDraft(undefined);
                      },
                    );
                  }}
                >
                  {t('Karakter törlése', 'Delete character')}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setRemoveId(undefined)}
                >
                  {t('Mégse', 'Cancel')}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {library.profiles.length > 0 && (
        <section className="platform-fields character-form">
          <h2>{t('Kalandhoz rendelt karakterek', 'Adventure assignments')}</h2>
          {adventures.map(({ manifest }) => (
            <label className="assignment-row" key={manifest.id}>
              {localizedLabel(manifest.title, locale)}
              <select
                value={library.assignments[manifest.id] ?? ''}
                onChange={(event) => {
                  const assignments = { ...library.assignments };
                  if (event.target.value) assignments[manifest.id] = event.target.value;
                  else delete assignments[manifest.id];
                  change({ ...library, assignments });
                }}
              >
                <option value="">
                  {t('Alapértelmezett', 'Default')} ·{' '}
                  {assignedProfile({ ...library, assignments: {} }, manifest.id)?.name}
                </option>
                {library.profiles.map(({ id, name }) => (
                  <option value={id} key={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </section>
      )}
    </main>
  );
}
