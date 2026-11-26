import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { canUseCardOnChoice, getAvailableChoices } from '../engine/engine';
import type { Content } from '../engine/validate';
import { portraitUrl } from '../platform/portraits';
import type { GameState, Hero } from '../engine/schema';
import { LocalStorageSaveRepository } from '../persistence/localStorageSaveRepository';
import {
  AUTOSAVE_SLOT_ID,
  type SaveRepository,
  type SaveSlotSummary,
  type SlotId,
} from '../persistence/saveRepository';
import { CharacterSheet } from './components/CharacterSheet';
import { EndingView } from './components/EndingView';
import { InventoryPanel } from './components/InventoryPanel';
import { SaveLoadModal } from './components/SaveLoadModal';
import { SceneView } from './components/SceneView';
import { createInitialUiState, gameReducer } from './gameReducer';
import { slotLabel } from './labels';
import { localizedLabel, type AdventureManifest } from '../platform/adventure';
import { brandName } from '../platform/brand';
import { useLanguage } from '../platform/language';

export interface AppProps {
  content: Content;
  saveRepository?: SaveRepository;
  manifest?: AdventureManifest;
  onLibrary?: () => void;
  initialSlot?: SlotId;
  portableHero?: Hero;
  onCreateCharacter?: () => void;
  resolveIllustration?: (nodeId: string) => { url: string; alt: string } | undefined;
}

export function App({
  content,
  saveRepository,
  manifest,
  onLibrary,
  initialSlot,
  portableHero,
  onCreateCharacter,
  resolveIllustration,
}: AppProps) {
  const { locale, t } = useLanguage();
  const title = manifest ? localizedLabel(manifest.title, locale) : brandName[locale];
  const statLabels =
    manifest &&
    Object.fromEntries(
      Object.entries(manifest.statLabels).map(([id, label]) => [id, localizedLabel(label, locale)]),
    );
  const [gameDifficulty, setGameDifficulty] = useState(0);
  const repo = useMemo(() => saveRepository ?? new LocalStorageSaveRepository(), [saveRepository]);
  const [ui, dispatch] = useReducer(gameReducer, undefined, createInitialUiState);
  const [modalOpen, setModalOpen] = useState(false);
  const [characterSheetOpen, setCharacterSheetOpen] = useState(false);
  const [slots, setSlots] = useState<SaveSlotSummary[]>([]);
  const [initialContent] = useState(content);
  const [loadError, setLoadError] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const refreshSlots = useCallback(async () => {
    const list = await repo.listSlots();
    setSlots(list);
  }, [repo]);

  const openModal = useCallback(async () => {
    setModalMessage(null);
    await refreshSlots();
    setModalOpen(true);
  }, [refreshSlots]);

  useEffect(() => {
    if (!initialSlot) return;
    let active = true;
    void repo
      .load(initialSlot)
      .then((loaded) => {
        if (!active) return;
        if (!canLoadState(initialContent, loaded.state)) {
          setLoadError(true);
          return;
        }
        dispatch({ type: 'LOAD_GAME', gameState: loaded.state, rng: loaded.rng });
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [initialSlot, repo, initialContent]);

  const currentHero =
    ui.gameState?.customHero ??
    (ui.gameState ? content.heroes.find((h) => h.id === ui.gameState!.heroId) : undefined);
  const currentNode = ui.gameState
    ? content.story.nodes.find((n) => n.id === ui.gameState!.nodeId)
    : undefined;

  const image = currentNode ? resolveIllustration?.(currentNode.id) : undefined;

  // Automentés minden állapotváltozás után játék közben
  useEffect(() => {
    if (ui.screen !== 'playing' || !ui.gameState || !currentHero || !currentNode) return;
    void repo
      .save(AUTOSAVE_SLOT_ID, ui.gameState, ui.rng, {
        nodeTitle: currentNode.title,
        heroName: currentHero.name,
      })
      .catch(() => {
        // A failed autosave must not interrupt play.
      });
  }, [repo, ui.screen, ui.gameState, ui.rng, currentHero, currentNode]);

  const handleSave = async (slotId: SlotId) => {
    if (!ui.gameState || !currentHero || !currentNode) return;
    try {
      await repo.save(slotId, ui.gameState, ui.rng, {
        nodeTitle: currentNode.title,
        heroName: currentHero.name,
      });
      setModalMessage(`${t('Mentve', 'Saved')}: ${slotLabel(slotId, locale)}.`);
      await refreshSlots();
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : 'A mentés nem sikerült.');
    }
  };

  const handleLoad = async (slotId: SlotId) => {
    try {
      const loaded = await repo.load(slotId);
      if (!canLoadState(content, loaded.state)) {
        setModalMessage(
          t(
            'A mentés nem kompatibilis a kaland jelenlegi változatával.',
            'The save is incompatible with this revision of the adventure.',
          ),
        );
        return;
      }
      dispatch({ type: 'LOAD_GAME', gameState: loaded.state, rng: loaded.rng });
      setModalOpen(false);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : 'A betöltés nem sikerült.');
    }
  };

  const handleDelete = async (slotId: SlotId) => {
    await repo.delete(slotId);
    setModalMessage(`${t('Törölve', 'Deleted')}: ${slotLabel(slotId, locale)}.`);
    await refreshSlots();
  };

  return (
    <div className="app-shell">
      {ui.screen === 'menu' && (
        <main className="menu-screen">
          <h1 className="menu-screen__title">{title}</h1>
          {manifest && (
            <p className="muted">
              {localizedLabel(manifest.genre, locale)} ·{' '}
              {
                {
                  easy: t('Könnyű', 'Easy'),
                  normal: t('Normál', 'Normal'),
                  hard: t('Nehéz', 'Hard'),
                }[manifest.difficulty]
              }{' '}
              · {manifest.minutes} {t('perc', 'min')}
            </p>
          )}
          {loadError && (
            <p role="alert" className="error-text">
              {t('A mentést nem sikerült betölteni.', 'The save could not be loaded.')}
            </p>
          )}
          <p className="menu-screen__subtitle">
            {manifest
              ? localizedLabel(manifest.description, locale)
              : t('Elágazó, interaktív kalandjáték.', 'An interactive branching adventure.')}
          </p>
          <div className="menu-screen__actions">
            {portableHero ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => dispatch({ type: 'GO_HERO_SELECT' })}
              >
                {t('Új játék', 'New game')}
              </button>
            ) : (
              onCreateCharacter && (
                <button type="button" className="btn btn--primary" onClick={onCreateCharacter}>
                  {t('Saját karakter létrehozása', 'Create your character')}
                </button>
              )
            )}
            <button type="button" className="btn btn--secondary" onClick={openModal}>
              {t('Betöltés', 'Load')}
            </button>
            {onLibrary && (
              <button type="button" className="btn btn--secondary" onClick={onLibrary}>
                {t('Vissza a könyvespolcra', 'Back to bookshelf')}
              </button>
            )}
          </div>
        </main>
      )}

      {ui.screen === 'heroSelect' && portableHero && (
        <main className="hero-screen">
          <h1>{t('Kaland előkészítése', 'Prepare adventure')}</h1>
          {portableHero && (
            <section className="platform-fields assigned-hero">
              <div className="profile-title">
                <img className="profile-portrait" src={portraitUrl(portableHero.portrait)} alt="" />
                <div>
                  <strong>{portableHero.name}</strong>
                  <p>
                    {portableHero.role} · {t('Kijelölt karakter', 'Assigned character')}
                  </p>
                </div>
              </div>
            </section>
          )}
          {manifest && (
            <label className="seed-row">
              {t('Játékmód', 'Difficulty mode')}
              <select
                value={gameDifficulty}
                onChange={(event) => setGameDifficulty(Number(event.target.value))}
              >
                <option value={2}>{t('Könnyű (+2 a próbákhoz)', 'Easy (+2 to checks)')}</option>
                <option value={0}>{t('Normál', 'Normal')}</option>
                <option value={-2}>{t('Nehéz (−2 a próbákhoz)', 'Hard (−2 to checks)')}</option>
              </select>
            </label>
          )}
          <div className="seed-row">
            <label htmlFor="seed-input">{t('Seed (opcionális):', 'Seed (optional):')}</label>
            <input
              id="seed-input"
              type="text"
              value={ui.seedInput}
              placeholder={t('Üresen véletlen', 'Leave empty for a random seed')}
              onChange={(e) => dispatch({ type: 'SET_SEED_INPUT', seed: e.target.value })}
            />
          </div>

          <div className="topbar__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() =>
                dispatch({
                  type: 'START_GAME',
                  content,
                  fallbackSeed: Date.now(),
                  customHero: portableHero,
                  difficultyModifier: gameDifficulty,
                })
              }
            >
              {t('Kaland indítása', 'Start adventure')}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => dispatch({ type: 'GO_MENU' })}
            >
              {t('Vissza', 'Back')}
            </button>
          </div>
        </main>
      )}

      {ui.screen === 'playing' && ui.gameState && currentHero && currentNode && (
        <>
          <header className="topbar">
            <span className="topbar__brand">{title}</span>
            <div className="topbar__actions">
              <button type="button" className="btn btn--secondary" onClick={openModal}>
                {t('Mentés / Betöltés', 'Save / load')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => dispatch({ type: 'GO_MENU' })}
              >
                {t('Főmenü', 'Main menu')}
              </button>
            </div>
          </header>

          {ui.error && (
            <p role="alert" className="error-text">
              {ui.error}
            </p>
          )}

          <div className="game-layout">
            <button
              type="button"
              className="btn btn--secondary character-toggle"
              aria-controls="reader-character"
              aria-expanded={characterSheetOpen}
              onClick={() => setCharacterSheetOpen((open) => !open)}
            >
              {t('Karakterlap', 'Character sheet')}
            </button>
            <aside
              id="reader-character"
              className="sidebar"
              data-expanded={characterSheetOpen}
              aria-label={t('Karakter adatok', 'Character information')}
            >
              <CharacterSheet
                hero={currentHero}
                statLabels={statLabels}
                state={ui.gameState}
                onUseHealCard={() => dispatch({ type: 'USE_HEAL_CARD', content })}
              />
              <InventoryPanel itemIds={ui.gameState.items} allItems={content.items} />
            </aside>

            <main className="reading-column">
              {currentNode.kind === 'scene' ? (
                <SceneView
                  node={currentNode}
                  choices={getAvailableChoices(content, ui.gameState)}
                  canUseCard={(choiceId) => canUseCardOnChoice(content, ui.gameState!, choiceId)}
                  cardName={currentHero.card.name}
                  statLabels={statLabels}
                  lastCheck={ui.lastCheck}
                  imageUrl={image?.url}
                  imageAlt={image?.alt}
                  onChoose={(choiceId, useCard) =>
                    dispatch({ type: 'CHOOSE', content, choiceId, useCard })
                  }
                />
              ) : (
                <EndingView
                  node={currentNode}
                  statLabels={statLabels}
                  lastCheck={ui.lastCheck}
                  imageUrl={image?.url}
                  imageAlt={image?.alt}
                  onRestart={() =>
                    portableHero ? dispatch({ type: 'GO_HERO_SELECT' }) : onCreateCharacter?.()
                  }
                  onMenu={() => dispatch({ type: 'GO_MENU' })}
                />
              )}
            </main>
          </div>
        </>
      )}

      {modalOpen && (
        <SaveLoadModal
          slots={slots}
          canSave={ui.screen === 'playing' && ui.gameState !== null}
          message={modalMessage}
          onSave={handleSave}
          onLoad={handleLoad}
          onDelete={handleDelete}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function canLoadState(content: Content, state: GameState): boolean {
  const hero = state.customHero ?? content.heroes.find(({ id }) => id === state.heroId);
  const activeNode = content.story.nodes.find(({ id }) => id === state.nodeId);
  const statKeys = Object.keys(content.heroes[0]?.stats ?? {});
  return Boolean(
    hero &&
    activeNode &&
    state.endingId === (activeNode.kind === 'ending' ? activeNode.id : null) &&
    statKeys.every((stat) => Object.hasOwn(state.stats, stat)) &&
    state.items.every((id) => content.items.some((item) => item.id === id)),
  );
}
