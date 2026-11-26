import { playerStorage } from '../persistence/playerStorage';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { App } from '../ui/App';
import { ComicIcon } from '../ui/components/ComicIcon';
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
import { brandName } from './brand';
import { Language, useLanguage } from './language';
import { listImportedAdventures, importAdventure, saveImportedAdventure } from './packages';
import { adventureSaves, migrateSilentSignalSaves } from './saves';
import authoringGuide from '../../docs/adventure-authoring.md?url';
import comicShore from './comic-shore.webp';
import './platform.css';
import './comic.css';

const builtIn = builtInCatalog();
const localeKey = 'kalandjatek:locale';

async function latestSave(entry: CatalogEntry) {
  try {
    const slots = await adventureSaves(entry.manifest.id).listSlots();
    return slots
      .filter((slot) => slot.status === 'ok')
      .sort((a, b) => b.metadata.savedAt.localeCompare(a.metadata.savedAt))[0];
  } catch {
    return undefined;
  }
}

function AdventureCard({
  adventure,
  onPlay,
  latest,
}: {
  adventure: CatalogEntry;
  latest?: SlotId;
  onPlay: (slot?: SlotId) => void;
}) {
  const { manifest, coverUrl } = adventure;
  const { locale, t } = useLanguage();
  const difficulty = {
    easy: t('Könnyű', 'Easy'),
    normal: t('Normál', 'Normal'),
    hard: t('Nehéz', 'Hard'),
  };
  const title = localizedLabel(manifest.title, locale);
  return (
    <article className="shelf-book">
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
    playerStorage.getItem(localeKey) === 'en' ? 'en' : 'hu',
  );
  const [section, setSection] = useState<'home' | 'shelf' | 'characters' | 'studio'>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [saved, setSaved] = useState<{
    adventureId: string;
    slot: SlotId;
    savedAt: string;
  }[]>([]);
  const [library, setLibrary] = useState<Profiles>(() => {
    try {
      return readProfiles();
    } catch {
      return { version: 1, profiles: [], defaultId: null, assignments: {} };
    }
  });
  const [imported, setImported] = useState<Adventure[]>([]);
  const [active, setActive] = useState<{ adventure: Adventure; slot?: SlotId }>();
  const [createFor, setCreateFor] = useState<Adventure>();
  const [editing, setEditing] = useState<{ adventure: Adventure; builtIn: boolean } | 'new'>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const adventures = useMemo(
    () => [
      ...builtIn,
      ...imported
        .filter((entry) => !builtIn.some((built) => built.manifest.id === entry.manifest.id))
        .map(importedCatalogEntry),
    ],
    [imported],
  );
  const adventure = active?.adventure;
  const content = useMemo(
    () => adventure && localizedContent(adventure, locale),
    [adventure, locale],
  );
  const repo = useMemo(() => active && adventureSaves(active.adventure.manifest.id), [active]);
  const isHu = locale === 'hu';
  const genres = [...new Map(adventures.map(({ manifest }) => [manifest.genre.hu, manifest.genre])).values()];
  const spotlight = adventures.find(({ manifest }) => manifest.id === 'lantern-keeper')
    ?? adventures[0];
  const featured = adventures.find(({ manifest }) => manifest.id === saved[0]?.adventureId)
    ?? spotlight;
  const normalizedSearch = search.trim().toLocaleLowerCase(locale);
  const visibleAdventures = [...adventures].sort((a, b) =>
    Number(b === spotlight) - Number(a === spotlight),
  ).filter(({ manifest }) =>
    (!genre || manifest.genre.hu === genre) &&
    (!normalizedSearch || [manifest.title, manifest.genre].some((label) =>
      localizedLabel(label, locale).toLocaleLowerCase(locale).includes(normalizedSearch),
    )),
  );
  const activeTab = settingsOpen || section === 'studio'
    ? 'settings'
    : journalOpen || section === 'characters'
      ? 'journal'
      : adventure ? 'shelf' : section;
  const temporaryStorage = useSyncExternalStore(playerStorage.subscribe, playerStorage.isTemporary);
  const [editorStorageError, setEditorStorageError] = useState('');
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
    setSettingsOpen(false);
    setJournalOpen(false);
    setPlaying(false);
    setCreateFor(undefined);
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
        if (active) setEditorStorageError(String(err));
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (active || !ready) return;
    let current = true;
    void Promise.all(adventures.map(async (entry) => {
      const slot = await latestSave(entry);
      return slot && {
        adventureId: entry.manifest.id,
        slot: slot.slotId,
        savedAt: slot.metadata.savedAt,
      };
    })).then((slots) => {
      if (current) {
        setSaved(slots.filter((slot) => slot !== undefined)
          .sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
      }
    });
    return () => { current = false; };
  }, [active, adventures, ready]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section, adventure, journalOpen]);

  useEffect(() => {
    playerStorage.setItem(localeKey, locale);
    document.documentElement.lang = locale;
    document.title = brandName[locale];
    document
      .querySelectorAll('meta[name="application-name"], meta[name="apple-mobile-web-app-title"]')
      .forEach((meta) => meta.setAttribute('content', brandName[locale]));
    document
      .querySelector('link[rel="manifest"]')
      ?.setAttribute(
        'href',
        `${import.meta.env.BASE_URL}${locale === 'hu' ? 'manifest.webmanifest' : 'manifest.en.webmanifest'}`,
      );
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
      if (action === 'play') {
        setSettingsOpen(false);
        setJournalOpen(false);
        setPlaying(false);
        setActive({ adventure, slot });
      } else setEditing({ adventure, builtIn: entry.builtIn });
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Language.Provider value={locale}>
      <div className="platform comic-platform">
        {!playing && (
          <header className="platform-bar">
            <button type="button" className="platform-home" disabled={busy} onClick={() => navigate('home')}>
              <ComicIcon name="book" />
              <span>{brandName[locale]}</span>
            </button>
            <button
              type="button"
              className="comic-icon-button"
              aria-label={isHu ? 'Keresés' : 'Search'}
              aria-expanded={searchOpen && section === 'shelf' && !adventure}
              disabled={busy}
              onClick={() => {
                if (section === 'shelf' && !adventure) {
                  setSearchOpen(!searchOpen);
                  if (searchOpen) setSearch('');
                }
                else {
                  navigate('shelf');
                  setSearchOpen(true);
                }
              }}
            >
              <ComicIcon name="search" />
            </button>
          </header>
        )}
        <nav className="platform-nav" aria-label={isHu ? 'Fő navigáció' : 'Main navigation'}>
          {([
            ['home', 'home', 'Főmenü', 'Main menu', () => navigate('home')],
            ['shelf', 'book', 'Könyvkaland', 'Book Adventures', () => navigate('shelf')],
            ['journal', 'journal', 'Napló', 'Journal', () => {
              if (playing) {
                setSettingsOpen(false);
                setJournalOpen(true);
              } else navigate('characters');
            }],
            ['settings', 'settings', 'Beállítások', 'Settings', () => setSettingsOpen(!settingsOpen)],
          ] as const).map(([key, icon, hu, en, onClick]) => (
            <button
              key={key}
              type="button"
              aria-current={activeTab === key ? 'page' : undefined}
              aria-expanded={key === 'settings' ? settingsOpen : undefined}
              disabled={busy}
              onClick={onClick}
            >
              <ComicIcon name={icon} />
              <span>{isHu ? hu : en}</span>
            </button>
          ))}
        </nav>
        {settingsOpen && (
          <section className="comic-settings" aria-label={isHu ? 'Beállítások' : 'Settings'}>
            <label>
              {isHu ? 'Nyelv' : 'Language'}{' '}
              <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
                <option value="hu">Magyar</option>
                <option value="en">English</option>
              </select>
            </label>
            <button type="button" className="btn btn--secondary" onClick={() => navigate('studio')}>
              {isHu ? 'Történetszerkesztő' : 'Story editor'}
            </button>
          </section>
        )}
        {temporaryStorage && (
          <p role="status" className="app-shell player-storage-notice">
            {isHu
              ? 'A böngésző nem tud minden játékadatot tartósan menteni. Az átmeneti adatok az oldal bezárásakor vagy újratöltésekor elveszhetnek.'
              : 'The browser cannot persist all player data. Temporary data may be lost when you close or reload the page.'}
          </p>
        )}
        {adventure && content && repo && (
          <App
            key={adventure.manifest.id}
            content={content}
            manifest={adventure.manifest}
            saveRepository={repo}
            initialSlot={active?.slot}
            portableHero={portableHero}
            onCreateCharacter={() => {
              navigate('characters');
              setCreateFor(adventure);
            }}
            onLibrary={() => navigate('shelf')}
            journalOpen={journalOpen}
            onJournalChange={setJournalOpen}
            onPlayingChange={setPlaying}
            resolveIllustration={(nodeId) => {
              const image = adventure.illustrations[nodeId];
              if (!image && adventure.manifest.id === 'lantern-keeper' && nodeId === content.story.startNodeId) {
                return {
                  url: comicShore,
                  alt: isHu ? 'Lámpás a ködös mólón, a távolban világítótoronnyal.' : 'A lantern on the misty pier with a lighthouse in the distance.',
                };
              }
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
          <div className="comic-library-journal">
            <p className="comic-journal-label">{isHu ? 'Napló' : 'Journal'}</p>
            <ProfileLibrary
              library={library}
              createOnOpen={Boolean(createFor)}
              adventures={adventures}
              onChange={(next) => {
                writeProfiles(next);
                setLibrary(next);
                if (createFor && assignedProfile(next, createFor.manifest.id)) {
                  setSection('shelf');
                  setActive({ adventure: createFor });
                  setCreateFor(undefined);
                }
              }}
            />
          </div>
        )}
        {!adventure && section === 'home' && (
          <main className="app-shell comic-home" aria-label={isHu ? 'Főmenü' : 'Main menu'}>
            {featured && (
              <div className="comic-feature">
                {featured.coverUrl && <img className="comic-feature__art" src={featured.coverUrl} alt="" />}
                <h1>{localizedLabel(featured.manifest.title, locale)}</h1>
                <div className="comic-feature__actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={busy || !ready || !saved[0]}
                    onClick={() => void openAdventure(featured, 'play', saved[0]?.slot)}
                  >
                    <ComicIcon name="play" />
                    {isHu ? 'Folytatás' : 'Continue'}
                  </button>
                  <button type="button" className="btn btn--secondary" disabled={busy} onClick={() => navigate('shelf')}>
                    <ComicIcon name="book" />
                    {isHu ? 'Új kaland' : 'New adventure'}
                  </button>
                </div>
              </div>
            )}
            {busy && <p role="status">{isHu ? 'Kaland betöltése…' : 'Loading adventure…'}</p>}
            {error && <p role="alert" className="error-text">{error}</p>}
          </main>
        )}
        {!adventure && section === 'shelf' && (
          <main className="app-shell bookshelf">
            <div className="bookshelf-heading">
              <h1>{isHu ? 'Könyvkaland' : 'Book Adventures'}</h1>
              {searchOpen && (
                <label className="comic-search">
                  {isHu ? 'Keresés a kalandok között' : 'Search adventures'}
                  <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
                </label>
              )}
              <div className="comic-filters" role="group" aria-label={isHu ? 'Műfajok' : 'Genres'}>
                <button type="button" aria-pressed={!genre} onClick={() => setGenre('')}>
                  {isHu ? 'Mind' : 'All'}
                </button>
                {genres.map((label) => (
                  <button key={label.hu} type="button" aria-pressed={genre === label.hu} onClick={() => setGenre(label.hu)}>
                    {localizedLabel(label, locale)}
                  </button>
                ))}
              </div>
            </div>
            {busy && <p role="status">{isHu ? 'Kaland betöltése…' : 'Loading adventure…'}</p>}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <div className="shelf-grid">
              {ready &&
                visibleAdventures.map((entry) => (
                  <AdventureCard
                    key={entry.manifest.id}
                    adventure={entry}
                    latest={saved.find((slot) => slot.adventureId === entry.manifest.id)?.slot}
                    onPlay={(slot) => {
                      if (!busy) void openAdventure(entry, 'play', slot);
                    }}
                  />
                ))}
            </div>
            {ready && !visibleAdventures.length && (
              <p>{isHu ? 'Nincs találat.' : 'No adventures found.'}</p>
            )}
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
            {(error || editorStorageError) && (
              <p role="alert" className="error-text">
                {error || editorStorageError}
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
