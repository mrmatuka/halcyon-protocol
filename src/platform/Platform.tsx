import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { App } from '../ui/App';
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
  onEdit,
}: {
  adventure: CatalogEntry;
  onPlay: (slot?: SlotId) => void;
  onEdit: () => void;
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
  return (
    <article className="adventure-card" style={themedStyle(manifest.theme)}>
      {coverUrl && <img className="adventure-cover" src={coverUrl} alt="" loading="lazy" />}
      <div className="adventure-card__body">
        <p className="adventure-card__meta">
          {localizedLabel(manifest.genre, locale)} · {difficulty[manifest.difficulty]} ·{' '}
          {manifest.minutes} {t('perc', 'min')}
        </p>
        <h2>{localizedLabel(manifest.title, locale)}</h2>
        <p>{localizedLabel(manifest.description, locale)}</p>
        <div className="topbar__actions">
          <button type="button" className="btn btn--primary" onClick={() => onPlay()}>
            {t('Kaland megnyitása', 'Open adventure')}
          </button>
          {latest && (
            <button type="button" className="btn btn--secondary" onClick={() => onPlay(latest)}>
              {t('Folytatás', 'Continue')}
            </button>
          )}
          <button type="button" className="btn btn--secondary" onClick={onEdit}>
            {t('Szerkesztés', 'Edit')}
          </button>
        </div>
      </div>
    </article>
  );
}

export function Platform() {
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem(localeKey) === 'en' ? 'en' : 'hu',
  );
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
          <button
            type="button"
            className="platform-home"
            onClick={() => {
              setActive(undefined);
              setEditing(undefined);
            }}
          >
            {isHu ? 'Kalandkönyvtár' : 'Adventure Library'}
          </button>
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
        {!adventure && editing && (
          <AdventureEditor
            key={editing === 'new' ? 'new' : editing.adventure.manifest.id}
            adventure={editing === 'new' ? undefined : editing.adventure}
            isBuiltIn={editing !== 'new' && editing.builtIn}
            onSave={storeAdventure}
            onClose={() => setEditing(undefined)}
          />
        )}
        {!adventure && !editing && (
          <main className="app-shell">
            <div className="library-header">
              <h1>{isHu ? 'Válassz kalandot' : 'Choose an adventure'}</h1>
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
            <div className="adventure-grid">
              {ready &&
                adventures.map((entry) => (
                  <AdventureCard
                    key={entry.manifest.id}
                    adventure={entry}
                    onPlay={(slot) => {
                      if (!busy) void openAdventure(entry, 'play', slot);
                    }}
                    onEdit={() => {
                      if (!busy) void openAdventure(entry, 'edit');
                    }}
                  />
                ))}
            </div>
          </main>
        )}
      </div>
    </Language.Provider>
  );
}
