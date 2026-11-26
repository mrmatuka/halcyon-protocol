import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { App } from '../ui/App';
import { ProfileLibrary } from './ProfileLibrary';
import {
  adaptProfile,
  assignedProfile,
  readProfiles,
  writeProfiles,
  type Profiles,
} from './profiles';
import type { SlotId } from '../persistence/saveRepository';
import { localizedContent, localizedLabel, type Adventure, type Locale } from './adventure';
import { builtInCatalog, importedCatalogEntry, type CatalogEntry } from './catalog';
import { AdventureEditor } from './AdventureEditor';
import { Language, useLanguage } from './language';
import { listImportedAdventures, importAdventure, saveImportedAdventure } from './packages';
import { adventureSaves, migrateSilentSignalSaves } from './saves';
import authoringGuide from '../../docs/adventure-authoring.md?url';
import './platform.css';

const builtIn = builtInCatalog();
const localeKey = 'kalandjatek:locale';

function themedStyle(theme: Adventure['manifest']['theme']): CSSProperties {
  return {
    '--bg': theme.background,
    '--surface': theme.surface,
    '--accent': theme.accent,
    '--text': theme.text,
    '--accent-strong': theme.accent,
    '--surface-elevated': `color-mix(in srgb, ${theme.surface}, ${theme.text} 8%)`,
    '--border': `color-mix(in srgb, ${theme.surface}, ${theme.accent} 25%)`,
    fontFamily: {
      serif: 'Georgia, serif',
      mono: 'ui-monospace, monospace',
      system: 'system-ui, sans-serif',
    }[theme.font],
  } as CSSProperties;
}

function AdventureCard({
  adventure,
  onPlay,
}: {
  adventure: CatalogEntry;
  onPlay: (slot?: SlotId) => void;
}) {
  const { manifest, coverUrl } = adventure;
  const { locale, t } = useLanguage();
  const [latest, setLatest] = useState<SlotId>();
  useEffect(() => {
    let active = true;
    void adventureSaves(manifest.id)
      .listSlots()
      .then((slots) => {
        const last = slots
          .filter((slot) => slot.status === 'ok')
          .sort((a, b) => b.metadata.savedAt.localeCompare(a.metadata.savedAt))[0];
        if (active) setLatest(last?.slotId);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [manifest.id]);
  const difficulty = {
    easy: t('Könnyű', 'Easy'),
    normal: t('Normál', 'Normal'),
    hard: t('Nehéz', 'Hard'),
  };
  const title = localizedLabel(manifest.title, locale);
  return (
    <article className="shelf-book" style={themedStyle(manifest.theme)}>
      <div className="book-frame">
        <button
          type="button"
          className="book-cover"
          aria-label={t('Kaland megnyitása', 'Open adventure')}
          aria-describedby={`book-${manifest.id}`}
          onClick={() => onPlay()}
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" loading="lazy" />
          ) : (
            <span className="book-emblem" aria-hidden="true">
              {title.slice(0, 1)}
            </span>
          )}
        </button>
        <h2 id={`book-${manifest.id}`} className="book-cover__title">
          {title}
        </h2>
      </div>
      <div className="shelf-book__caption">
        <p>
          {localizedLabel(manifest.genre, locale)} · {difficulty[manifest.difficulty]}
        </p>
        {latest && (
          <button type="button" className="shelf-continue" onClick={() => onPlay(latest)}>
            {t('Folytatás', 'Continue')}
          </button>
        )}
      </div>
    </article>
  );
}

export function Platform() {
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem(localeKey) === 'en' ? 'en' : 'hu',
  );
  const [section, setSection] = useState<'shelf' | 'characters' | 'studio'>('shelf');
  const [library, setLibrary] = useState<Profiles>(() => {
    try {
      return readProfiles();
    } catch {
      return { version: 1, profiles: [], defaultId: null, assignments: {} };
    }
  });
  const [imported, setImported] = useState<Adventure[]>([]);
  const [active, setActive] = useState<{ adventure: Adventure; slot?: SlotId }>();
  const [editing, setEditing] = useState<{ adventure: Adventure; builtIn: boolean } | 'new'>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const adventures = [
    ...builtIn,
    ...imported
      .filter((entry) => !builtIn.some((built) => built.manifest.id === entry.manifest.id))
      .map(importedCatalogEntry),
  ];
  const adventure = active?.adventure;
  const content = useMemo(
    () => adventure && localizedContent(adventure, locale),
    [adventure, locale],
  );
  const repo = useMemo(() => active && adventureSaves(active.adventure.manifest.id), [active]);
  const isHu = locale === 'hu';
  const profile = adventure && assignedProfile(library, adventure.manifest.id);
  const portableHero = useMemo(
    () =>
      profile && adventure && content
        ? adaptProfile(profile, adventure.manifest, content, locale)
        : undefined,
    [profile, adventure, content, locale],
  );

  function navigate(next: typeof section) {
    setSection(next);
    setActive(undefined);
    setEditing(undefined);
    setNotice('');
    setError('');
  }
  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => {
        migrateSilentSignalSaves();
        return listImportedAdventures();
      })
      .then((entries) => {
        if (active) setImported(entries);
      })
      .catch((err: unknown) => {
        if (active) setError(String(err));
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    localStorage.setItem(localeKey, locale);
    document.documentElement.lang = locale;
    document.title = locale === 'hu' ? 'Kalandkönyvtár' : 'Adventure Library';
  }, [locale]);

  async function storeAdventure(entry: Adventure) {
    if (builtIn.some((existing) => existing.manifest.id === entry.manifest.id))
      throw new Error(
        isHu
          ? 'Ez egy beépített kaland azonosítója. A másolathoz válassz másik azonosítót.'
          : 'This ID belongs to a built-in adventure. Choose another ID for your copy.',
      );
    await saveImportedAdventure(entry);
    setImported((current) => [
      ...current.filter((existing) => existing.manifest.id !== entry.manifest.id),
      entry,
    ]);
  }

  async function openAdventure(entry: CatalogEntry, action: 'play' | 'edit', slot?: SlotId) {
    setBusy(true);
    setError('');
    try {
      const adventure = await entry.load();
      if (action === 'play') setActive({ adventure, slot });
      else setEditing({ adventure, builtIn: entry.builtIn });
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Language.Provider value={locale}>
      <div className="platform" style={adventure && themedStyle(adventure.manifest.theme)}>
        <header className="platform-bar">
          <button type="button" className="platform-home" onClick={() => navigate('shelf')}>
            {isHu ? 'Kalandkönyvtár' : 'Adventure Library'}
          </button>
          <nav className="platform-nav" aria-label={isHu ? 'Fő navigáció' : 'Main navigation'}>
            {(
              [
                ['shelf', 'Könyvespolc', 'Bookshelf'],
                ['characters', 'Karakterek', 'Characters'],
                ['studio', 'Történetszerkesztő', 'Story editor'],
              ] as const
            ).map(([key, hu, en]) => (
              <button
                key={key}
                type="button"
                aria-current={section === key ? 'page' : undefined}
                disabled={busy}
                onClick={() => navigate(key)}
              >
                {isHu ? hu : en}
              </button>
            ))}
          </nav>
          <label>
            {isHu ? 'Nyelv' : 'Language'}{' '}
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              <option value="hu">Magyar</option>
              <option value="en">English</option>
            </select>
          </label>
        </header>
        {adventure && content && repo && (
          <App
            key={adventure.manifest.id}
            content={content}
            manifest={adventure.manifest}
            saveRepository={repo}
            initialSlot={active?.slot}
            portableHero={portableHero}
            onLibrary={() => setActive(undefined)}
            resolveIllustration={(nodeId) => {
              const image = adventure.illustrations[nodeId];
              return (
                image && {
                  url: adventure.images[image.path],
                  alt:
                    locale === adventure.manifest.defaultLocale
                      ? image.alt
                      : (adventure.translations[`image.${nodeId}.alt`] ?? image.alt),
                }
              );
            }}
          />
        )}
        {!adventure && section === 'studio' && editing && (
          <AdventureEditor
            key={editing === 'new' ? 'new' : editing.adventure.manifest.id}
            adventure={editing === 'new' ? undefined : editing.adventure}
            isBuiltIn={editing !== 'new' && editing.builtIn}
            onSave={storeAdventure}
            onClose={() => setEditing(undefined)}
          />
        )}
        {!adventure && section === 'characters' && (
          <ProfileLibrary
            library={library}
            adventures={adventures}
            onChange={(next) => {
              writeProfiles(next);
              setLibrary(next);
            }}
          />
        )}
        {!adventure && section === 'shelf' && (
          <main className="app-shell bookshelf">
            <div className="bookshelf-heading">
              <h1>{isHu ? 'Könyvespolc' : 'Bookshelf'}</h1>
              <p>{isHu ? 'Válassz kalandot' : 'Choose an adventure'}</p>
            </div>
            {busy && <p role="status">{isHu ? 'Kaland betöltése…' : 'Loading adventure…'}</p>}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <div className="shelf-grid">
              {ready &&
                adventures.map((entry) => (
                  <AdventureCard
                    key={entry.manifest.id}
                    adventure={entry}
                    onPlay={(slot) => {
                      if (!busy) void openAdventure(entry, 'play', slot);
                    }}
                  />
                ))}
            </div>
          </main>
        )}
        {!adventure && section === 'studio' && !editing && (
          <main className="app-shell">
            <div className="library-header">
              <h1>{isHu ? 'Történetszerkesztő' : 'Story editor'}</h1>
              <div className="topbar__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setEditing('new')}
                >
                  {isHu ? 'Új kaland szerkesztése' : 'Create an adventure'}
                </button>
                <a
                  href={authoringGuide}
                  download="adventure-authoring.md"
                  className="btn btn--secondary"
                >
                  {isHu ? 'AI szerzői útmutató' : 'AI authoring guide'}
                </a>
                <label className="btn btn--secondary zip-upload">
                  {isHu ? 'ZIP importálása' : 'Import ZIP'}
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    disabled={busy}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (!file) return;
                      setBusy(true);
                      setError('');
                      setNotice('');
                      try {
                        const entry = await importAdventure(file);
                        if (adventures.some(({ manifest }) => manifest.id === entry.manifest.id))
                          throw new Error(
                            isHu
                              ? 'Már van ilyen azonosítójú kaland. A szerkesztőben adj új azonosítót a csomagnak.'
                              : 'An adventure with this ID already exists. Give the package a new ID in the editor.',
                          );
                        await storeAdventure(entry);
                        setNotice(
                          isHu
                            ? 'A kaland bekerült a helyi könyvtárba.'
                            : 'Adventure added to your local library.',
                        );
                      } catch (err) {
                        setError(String(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            {busy && <p role="status">{isHu ? 'Kaland betöltése…' : 'Loading adventure…'}</p>}
            {notice && <p role="status">{notice}</p>}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <div className="studio-list">
              {ready &&
                adventures.map((entry) => (
                  <article className="studio-row" key={entry.manifest.id}>
                    <div>
                      <h2>{localizedLabel(entry.manifest.title, locale)}</h2>
                      <p className="muted">
                        {entry.builtIn
                          ? isHu
                            ? 'Beépített · másolatként szerkeszthető'
                            : 'Built in · edit a copy'
                          : isHu
                            ? 'Helyi kaland'
                            : 'Local adventure'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={busy}
                      onClick={() => void openAdventure(entry, 'edit')}
                    >
                      {isHu ? 'Szerkesztés' : 'Edit'}
                    </button>
                  </article>
                ))}
            </div>
          </main>
        )}
      </div>
    </Language.Provider>
  );
}
