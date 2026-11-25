import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { canUseCardOnChoice, getAvailableChoices } from '../engine/engine';
import type { Content } from '../engine/validate';
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
import { getIllustration } from '../content/illustrations';
import { loadGameContent } from '../content/loadContent';
import { createInitialUiState, gameReducer } from './gameReducer';
import { SLOT_LABELS } from './labels';

export interface AppProps {
  content?: Content;
  saveRepository?: SaveRepository;
  getImageUrl?: (nodeId: string) => string | undefined;
}

export function App({ content = loadGameContent(), saveRepository, getImageUrl }: AppProps) {
  const repo = useMemo(() => saveRepository ?? new LocalStorageSaveRepository(), [saveRepository]);
  const [ui, dispatch] = useReducer(gameReducer, content, createInitialUiState);
  const [modalOpen, setModalOpen] = useState(false);
  const [slots, setSlots] = useState<SaveSlotSummary[]>([]);
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

  const currentHero = ui.gameState
    ? content.heroes.find((h) => h.id === ui.gameState!.heroId)
    : undefined;
  const currentNode = ui.gameState
    ? content.story.nodes.find((n) => n.id === ui.gameState!.nodeId)
    : undefined;

  // Automentés minden állapotváltozás után játék közben
  useEffect(() => {
    if (ui.screen !== 'playing' || !ui.gameState || !currentHero || !currentNode) return;
    void repo
      .save(AUTOSAVE_SLOT_ID, ui.gameState, ui.rng, {
        nodeTitle: currentNode.title,
        heroName: currentHero.name,
      })
      .catch(() => {
        // Automentés hibája ne akassza meg a játékmenetet
      });
  }, [repo, ui.screen, ui.gameState, ui.rng, currentHero, currentNode]);

  const handleSave = async (slotId: SlotId) => {
    if (!ui.gameState || !currentHero || !currentNode) return;
    try {
      await repo.save(slotId, ui.gameState, ui.rng, {
        nodeTitle: currentNode.title,
        heroName: currentHero.name,
      });
      setModalMessage(`Mentve: ${SLOT_LABELS[slotId]}.`);
      await refreshSlots();
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : 'A mentés nem sikerült.');
    }
  };

  const handleLoad = async (slotId: SlotId) => {
    try {
      const loaded = await repo.load(slotId);
      dispatch({ type: 'LOAD_GAME', gameState: loaded.state, rng: loaded.rng });
      setModalOpen(false);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : 'A betöltés nem sikerült.');
    }
  };

  const handleDelete = async (slotId: SlotId) => {
    await repo.delete(slotId);
    setModalMessage(`Törölve: ${SLOT_LABELS[slotId]}.`);
    await refreshSlots();
  };

  return (
    <div className="app-shell">
      {ui.screen === 'menu' && (
        <main className="menu-screen">
          <h1 className="menu-screen__title">Csendes Jel</h1>
          <p className="menu-screen__subtitle">
            Interaktív sci-fi kalandjáték az Ébenhold fagyos kutatóállomásán.
          </p>
          <div className="menu-screen__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => dispatch({ type: 'GO_HERO_SELECT' })}
            >
              Új játék
            </button>
            <button type="button" className="btn btn--secondary" onClick={openModal}>
              Betöltés
            </button>
          </div>
        </main>
      )}

      {ui.screen === 'heroSelect' && (
        <main className="hero-screen">
          <h1>Válassz hőst</h1>
          <div className="hero-grid">
            {content.heroes.map((hero) => {
              const selected = hero.id === ui.selectedHeroId;
              return (
                <button
                  key={hero.id}
                  type="button"
                  aria-pressed={selected}
                  className={`hero-card ${selected ? 'hero-card--selected' : ''}`}
                  onClick={() => dispatch({ type: 'SELECT_HERO', heroId: hero.id })}
                >
                  <strong>{hero.name}</strong>
                  <span className="hero-card__role">{hero.role}</span>
                  <span>{hero.description}</span>
                  <span className="hero-card__stats">
                    Életerő {hero.stats.eletero} · Reflex {hero.stats.reflex} · Technika{' '}
                    {hero.stats.technika} · Kitartás {hero.stats.kitartas} · Szerencse{' '}
                    {hero.stats.szerencse}
                  </span>
                  <span className="badge badge--accent">Kártya: {hero.card.name}</span>
                </button>
              );
            })}
          </div>

          <div className="seed-row">
            <label htmlFor="seed-input">Seed (opcionális):</label>
            <input
              id="seed-input"
              type="text"
              value={ui.seedInput}
              placeholder="Üresen véletlen"
              onChange={(e) => dispatch({ type: 'SET_SEED_INPUT', seed: e.target.value })}
            />
          </div>

          <div className="topbar__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => dispatch({ type: 'START_GAME', content, fallbackSeed: Date.now() })}
            >
              Kaland indítása
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => dispatch({ type: 'GO_MENU' })}
            >
              Vissza
            </button>
          </div>
        </main>
      )}

      {ui.screen === 'playing' && ui.gameState && currentHero && currentNode && (
        <>
          <header className="topbar">
            <span className="topbar__brand">Csendes Jel</span>
            <div className="topbar__actions">
              <button type="button" className="btn btn--secondary" onClick={openModal}>
                Mentés / Betöltés
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => dispatch({ type: 'GO_MENU' })}
              >
                Főmenü
              </button>
            </div>
          </header>

          {ui.error && (
            <p role="alert" className="error-text">
              {ui.error}
            </p>
          )}

          <div className="game-layout">
            <main>
              {currentNode.kind === 'scene' ? (
                <SceneView
                  node={currentNode}
                  choices={getAvailableChoices(content, ui.gameState)}
                  canUseCard={(choiceId) => canUseCardOnChoice(content, ui.gameState!, choiceId)}
                  cardName={currentHero.card.name}
                  lastCheck={ui.lastCheck}
                  imageUrl={
                    getImageUrl ? getImageUrl(currentNode.id) : getIllustration(currentNode.id)?.url
                  }
                  imageAlt={getIllustration(currentNode.id)?.alt}
                  onChoose={(choiceId, useCard) =>
                    dispatch({ type: 'CHOOSE', content, choiceId, useCard })
                  }
                />
              ) : (
                <EndingView
                  node={currentNode}
                  lastCheck={ui.lastCheck}
                  imageUrl={
                    getImageUrl ? getImageUrl(currentNode.id) : getIllustration(currentNode.id)?.url
                  }
                  imageAlt={getIllustration(currentNode.id)?.alt}
                  onRestart={() => dispatch({ type: 'GO_HERO_SELECT' })}
                  onMenu={() => dispatch({ type: 'GO_MENU' })}
                />
              )}
            </main>

            <aside className="sidebar" aria-label="Karakter adatok">
              <CharacterSheet
                hero={currentHero}
                state={ui.gameState}
                onUseHealCard={() => dispatch({ type: 'USE_HEAL_CARD', content })}
              />
              <InventoryPanel itemIds={ui.gameState.items} allItems={content.items} />
            </aside>
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
