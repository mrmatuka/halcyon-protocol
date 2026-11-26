import { useState, type ReactNode } from 'react';
import type { Choice, StoryNode } from '../engine/schema';
import {
  adventureFiles,
  parseAdventure,
  type Adventure,
  type AdventureManifest,
} from './adventure';
import { useLanguage } from './language';
import { encodeImage, exportAdventure, importAdventure } from './packages';

const template: Adventure = {
  manifest: {
    version: 1,
    id: 'uj-kaland',
    title: { hu: 'Új kaland', en: 'New adventure' },
    description: { hu: 'A kaland rövid leírása.', en: 'A short description of the adventure.' },
    genre: { hu: 'Fantasy', en: 'Fantasy' },
    difficulty: 'normal',
    minutes: 5,
    defaultLocale: 'hu',
    statLabels: { figyelem: { hu: 'Figyelem', en: 'Awareness' } },
    characterMode: 'both',
    theme: {
      background: '#0b121b',
      surface: '#121c29',
      accent: '#5cc8ff',
      text: '#e6eef7',
      font: 'system',
    },
  },
  content: {
    heroes: [
      {
        id: 'vandor',
        name: 'Vándor',
        role: 'Felfedező',
        description: '',
        stats: { eletero: 10, figyelem: 7 },
        card: {
          id: 'segitseg',
          name: 'Második esély',
          description: '',
          options: [{ type: 'reroll', stats: ['figyelem'] }],
        },
      },
    ],
    items: [],
    story: {
      startNodeId: 'kezdet',
      deathEndingId: 'vereseg',
      nodes: [
        {
          id: 'kezdet',
          title: 'Kezdet',
          text: '',
          kind: 'scene',
          choices: [{ id: 'kezdet_tovabb', text: 'Tovább', target: 'befejezes' }],
        },
        { id: 'befejezes', title: 'Befejezés', text: '', kind: 'ending', endingType: 'victory' },
        { id: 'vereseg', title: 'Vereség', text: '', kind: 'ending', endingType: 'death' },
      ],
    },
  },
  illustrations: {},
  translations: {},
  images: {},
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="editor-field">
      {label}
      {children}
    </label>
  );
}

export function AdventureEditor({
  adventure,
  isBuiltIn,
  onSave,
  onClose,
}: {
  adventure?: Adventure;
  isBuiltIn: boolean;
  onSave: (adventure: Adventure) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<Adventure>(() => structuredClone(adventure ?? template));
  const [selected, setSelected] = useState(draft.content.story.startNodeId);
  const [showEnglish, setShowEnglish] = useState(false);
  const [advanced, setAdvanced] = useState<string>();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { manifest, content } = draft;
  const { story } = content;
  const node = story.nodes.find(({ id }) => id === selected);
  const originalId = adventure?.manifest.id;
  function updateManifest(patch: Partial<AdventureManifest>) {
    setDraft((d) => ({ ...d, manifest: { ...d.manifest, ...patch } }));
  }
  function updateStory(patch: Partial<typeof story>) {
    setDraft((d) => ({ ...d, content: { ...d.content, story: { ...d.content.story, ...patch } } }));
  }
  function updateNode(next: StoryNode) {
    updateStory({ nodes: story.nodes.map((entry) => (entry.id === next.id ? next : entry)) });
  }
  function setTranslated(key: string, value: string) {
    setDraft((d) => ({ ...d, translations: { ...d.translations, [key]: value } }));
  }
  function setChoice(id: string, choice: Choice) {
    if (node?.kind === 'scene')
      updateNode({
        ...node,
        choices: node.choices.map((entry) => (entry.id === id ? choice : entry)),
      });
  }
  function addNode(kind: StoryNode['kind']) {
    const id = nextId(
      kind,
      story.nodes.map((entry) => entry.id),
    );
    const common = {
      id,
      title: kind === 'scene' ? t('Új jelenet', 'New scene') : t('Új befejezés', 'New ending'),
      text: '',
    };
    const created: StoryNode =
      kind === 'scene'
        ? {
            ...common,
            kind,
            choices: [{ id: `${id}_1`, text: t('Tovább', 'Continue'), target: story.startNodeId }],
          }
        : { ...common, kind, endingType: 'victory' };
    updateStory({ nodes: [...story.nodes, created] });
    setSelected(id);
  }
  async function perform(action: 'validate' | 'save' | 'export') {
    setBusy(true);
    setStatus('');
    setError('');
    try {
      if (advanced !== undefined)
        throw new Error(
          t(
            'Először alkalmazd vagy zárd be a JSON-szerkesztőt.',
            'Apply or close the JSON editor first.',
          ),
        );
      const validated = parseAdventure(adventureFiles(draft), draft.images);
      if (action === 'save') {
        if (isBuiltIn && validated.manifest.id === originalId)
          throw new Error(
            t('A másolathoz adj új kalandazonosítót.', 'Give the copy a new adventure ID.'),
          );
        const copy = await importIfBuiltIn(validated, isBuiltIn);
        await onSave(copy);
        setStatus(t('Mentve a helyi kalandkönyvtárba.', 'Saved to your local library.'));
        onClose();
      } else if (action === 'export') {
        const zip = await exportAdventure(validated);
        const url = URL.createObjectURL(zip);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${validated.manifest.id}.zip`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else setStatus(t('A kalandcsomag érvényes.', 'The adventure package is valid.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }
  async function uploadImage(file: File | undefined, target?: StoryNode) {
    if (!file) return;
    setError('');
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    if (!extension) {
      setError(t('JPEG, PNG vagy WebP képet válassz.', 'Choose a JPEG, PNG, or WebP image.'));
      return;
    }
    try {
      const data = await encodeImage(file);
      const path = `images/${target?.id ?? 'cover'}_${Date.now()}.${extension}`;
      setDraft((d) => ({
        ...d,
        images: { ...d.images, [path]: data },
        manifest: target ? d.manifest : { ...d.manifest, cover: path },
        illustrations: target
          ? { ...d.illustrations, [target.id]: { path, alt: target.title } }
          : d.illustrations,
      }));
    } catch (err) {
      setError(String(err));
    }
  }
  function destination(label: string, value: string, onChange: (id: string) => void) {
    return (
      <Field label={label}>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {!story.nodes.some(({ id }) => id === value) && <option value={value}>{value}</option>}
          {story.nodes.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title} [{entry.id}]
            </option>
          ))}
        </select>
      </Field>
    );
  }

  return (
    <main className="app-shell">
      <h1>{t('Kaland szerkesztése', 'Adventure editor')}</h1>
      <div className="topbar__actions">
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          {t('Vissza', 'Back')}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy}
          onClick={() => void perform('validate')}
        >
          {t('Ellenőrzés', 'Validate')}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy}
          onClick={() => void perform('export')}
        >
          {t('ZIP letöltése', 'Download ZIP')}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={() => void perform('save')}
        >
          {isBuiltIn
            ? t('Mentés másolatként', 'Save a copy')
            : t('Mentés a könyvtárba', 'Save to library')}
        </button>
      </div>
      {error && (
        <pre role="alert" className="editor-error">
          {error}
        </pre>
      )}
      {status && <p role="status">{status}</p>}
      <details className="editor-details" open>
        <summary>{t('Adatlap és kinézet', 'Details and theme')}</summary>
        <div className="editor-settings">
          <Field label={t('Kalandazonosító', 'Adventure ID')}>
            <input
              value={manifest.id}
              readOnly={Boolean(adventure && !isBuiltIn)}
              onChange={(e) => updateManifest({ id: e.target.value })}
            />
          </Field>
          {(['title', 'description', 'genre'] as const).map((key) => {
            const label = {
              title: t('Cím', 'Title'),
              description: t('Leírás', 'Description'),
              genre: t('Műfaj', 'Genre'),
            }[key];
            return (
              <div className="editor-pair" key={key}>
                {(['hu', 'en'] as const).map((lang) => (
                  <Field key={lang} label={`${label} (${lang.toUpperCase()})`}>
                    <input
                      value={manifest[key][lang] ?? ''}
                      onChange={(e) =>
                        updateManifest({
                          [key]: {
                            ...manifest[key],
                            [lang]: e.target.value || (lang === 'en' ? undefined : ''),
                          },
                        })
                      }
                    />
                  </Field>
                ))}
              </div>
            );
          })}
          <Field label={t('Játékidő (perc)', 'Play time (minutes)')}>
            <input
              type="number"
              min="1"
              value={manifest.minutes}
              onChange={(e) => updateManifest({ minutes: Number(e.target.value) })}
            />
          </Field>
          <Field label={t('Nehézség', 'Difficulty')}>
            <select
              value={manifest.difficulty}
              onChange={(e) =>
                updateManifest({ difficulty: e.target.value as AdventureManifest['difficulty'] })
              }
            >
              <option value="easy">{t('Könnyű', 'Easy')}</option>
              <option value="normal">{t('Normál', 'Normal')}</option>
              <option value="hard">{t('Nehéz', 'Hard')}</option>
            </select>
          </Field>
          <Field label={t('Karakterválasztás', 'Character mode')}>
            <select
              value={manifest.characterMode}
              onChange={(e) =>
                updateManifest({
                  characterMode: e.target.value as AdventureManifest['characterMode'],
                })
              }
            >
              <option value="both">{t('Mindkettő', 'Both')}</option>
              <option value="preset">{t('Kész karakterek', 'Preset heroes')}</option>
              <option value="custom">{t('Saját karakter', 'Custom character')}</option>
            </select>
          </Field>
          {(['background', 'surface', 'accent', 'text'] as const).map((key) => (
            <Field
              key={key}
              label={
                {
                  background: t('Háttér', 'Background'),
                  surface: t('Felület', 'Surface'),
                  accent: t('Kiemelés', 'Accent'),
                  text: t('Szövegszín', 'Text color'),
                }[key]
              }
            >
              <input
                type="color"
                value={manifest.theme[key]}
                onChange={(e) =>
                  updateManifest({ theme: { ...manifest.theme, [key]: e.target.value } })
                }
              />
            </Field>
          ))}
          <Field label={t('Betűtípus', 'Typeface')}>
            <select
              value={manifest.theme.font}
              onChange={(e) =>
                updateManifest({
                  theme: {
                    ...manifest.theme,
                    font: e.target.value as AdventureManifest['theme']['font'],
                  },
                })
              }
            >
              <option value="system">{t('Rendszer', 'System')}</option>
              <option value="serif">{t('Talpas', 'Serif')}</option>
              <option value="mono">{t('Fix szélességű', 'Monospace')}</option>
            </select>
          </Field>
          <Field label={t('Borítókép', 'Cover image')}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void uploadImage(e.target.files?.[0])}
            />
          </Field>
          {destination(t('Kezdőcsomópont', 'Start node'), story.startNodeId, (id) =>
            updateStory({ startNodeId: id }),
          )}
          {destination(
            t('Nulla életerő befejezése', 'Zero health ending'),
            story.deathEndingId,
            (id) => updateStory({ deathEndingId: id }),
          )}
        </div>
      </details>
      <div className="editor-grid">
        <section aria-label={t('Történetgráf', 'Story graph')} className="platform-fields">
          <h2>{t('Történetgráf', 'Story graph')}</h2>
          <div className="topbar__actions">
            <button type="button" className="btn btn--secondary" onClick={() => addNode('scene')}>
              {t('Új jelenet', 'Add scene')}
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => addNode('ending')}>
              {t('Új befejezés', 'Add ending')}
            </button>
          </div>
          <ol className="graph-list">
            {story.nodes.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="graph-node"
                  aria-pressed={entry.id === selected}
                  onClick={() => setSelected(entry.id)}
                >
                  {entry.title} <small>{entry.id}</small>
                </button>
                {entry.kind === 'scene' && (
                  <ul>
                    {entry.choices.map((choice) => (
                      <li key={choice.id}>
                        {'target' in choice ? (
                          <button type="button" onClick={() => setSelected(choice.target)}>
                            ↳ {choice.target}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelected(choice.success.target)}
                            >
                              ✓ {choice.success.target}
                            </button>{' '}
                            <button
                              type="button"
                              onClick={() => setSelected(choice.failure.target)}
                            >
                              × {choice.failure.target}
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
        {node && (
          <section className="platform-fields">
            <h2>{node.id}</h2>
            <label>
              <input
                type="checkbox"
                checked={showEnglish}
                onChange={(event) => setShowEnglish(event.target.checked)}
              />{' '}
              {t('Második nyelv szerkesztése', 'Edit secondary language')}
            </label>
            <Field label={t('Jelenetcím', 'Node title')}>
              <input
                value={
                  showEnglish ? (draft.translations[`node.${node.id}.title`] ?? '') : node.title
                }
                onChange={(e) =>
                  showEnglish
                    ? setTranslated(`node.${node.id}.title`, e.target.value)
                    : updateNode({ ...node, title: e.target.value })
                }
              />
            </Field>
            <Field label={t('Történetszöveg', 'Story text')}>
              <textarea
                rows={8}
                value={showEnglish ? (draft.translations[`node.${node.id}.text`] ?? '') : node.text}
                onChange={(e) =>
                  showEnglish
                    ? setTranslated(`node.${node.id}.text`, e.target.value)
                    : updateNode({ ...node, text: e.target.value })
                }
              />
            </Field>
            <Field label={t('Jelenetképfájl', 'Scene image')}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void uploadImage(e.target.files?.[0], node)}
              />
            </Field>
            {draft.illustrations[node.id] && (
              <>
                <img
                  className="editor-image"
                  src={draft.images[draft.illustrations[node.id].path]}
                  alt=""
                />
                <Field label={t('Kép leírása', 'Image description')}>
                  <input
                    value={
                      showEnglish
                        ? (draft.translations[`image.${node.id}.alt`] ?? '')
                        : draft.illustrations[node.id].alt
                    }
                    onChange={(e) => {
                      const text = e.target.value;
                      if (showEnglish) setTranslated(`image.${node.id}.alt`, text);
                      else
                        setDraft((d) => ({
                          ...d,
                          illustrations: {
                            ...d.illustrations,
                            [node.id]: { ...d.illustrations[node.id], alt: text },
                          },
                        }));
                    }}
                  />
                </Field>
              </>
            )}
            {node.kind === 'ending' && (
              <Field label={t('Befejezés típusa', 'Ending type')}>
                <select
                  value={node.endingType}
                  onChange={(e) =>
                    updateNode({ ...node, endingType: e.target.value as 'death' | 'victory' })
                  }
                >
                  <option value="victory">{t('Túlélés', 'Survival')}</option>
                  <option value="death">{t('Halál', 'Death')}</option>
                </select>
              </Field>
            )}
            {node.kind === 'scene' && (
              <>
                {node.choices.map((choice) => (
                  <fieldset key={choice.id} className="platform-fields editor-choice">
                    <legend>{choice.id}</legend>
                    <Field label={t('Választás szövege', 'Choice text')}>
                      <input
                        value={
                          showEnglish
                            ? (draft.translations[`choice.${choice.id}`] ?? '')
                            : choice.text
                        }
                        onChange={(e) =>
                          showEnglish
                            ? setTranslated(`choice.${choice.id}`, e.target.value)
                            : setChoice(choice.id, { ...choice, text: e.target.value })
                        }
                      />
                    </Field>
                    <Field label={t('Próba', 'Check')}>
                      <select
                        value={'check' in choice ? choice.check.stat : ''}
                        onChange={(e) => {
                          const stat = e.target.value;
                          const { id, text, condition } = choice;
                          if (stat && 'check' in choice)
                            setChoice(id, { ...choice, check: { stat } });
                          else if (stat && 'target' in choice)
                            setChoice(id, {
                              id,
                              text,
                              condition,
                              check: { stat },
                              success: { target: choice.target, effects: choice.effects },
                              failure: { target: story.deathEndingId },
                            });
                          else if ('check' in choice)
                            setChoice(id, {
                              id,
                              text,
                              condition,
                              target: choice.success.target,
                              effects: choice.success.effects,
                            });
                        }}
                      >
                        <option value="">{t('Egyszerű választás', 'Simple choice')}</option>
                        {Object.entries(manifest.statLabels)
                          .filter(([id]) => id !== 'eletero')
                          .map(([id, label]) => (
                            <option key={id} value={id}>
                              {label.hu}
                            </option>
                          ))}
                      </select>
                    </Field>
                    {'target' in choice ? (
                      destination(t('Cél', 'Target'), choice.target, (target) =>
                        setChoice(choice.id, { ...choice, target }),
                      )
                    ) : (
                      <>
                        {destination(
                          t('Siker esetén', 'On success'),
                          choice.success.target,
                          (target) =>
                            setChoice(choice.id, {
                              ...choice,
                              success: { ...choice.success, target },
                            }),
                        )}
                        {destination(
                          t('Kudarc esetén', 'On failure'),
                          choice.failure.target,
                          (target) =>
                            setChoice(choice.id, {
                              ...choice,
                              failure: { ...choice.failure, target },
                            }),
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() =>
                        updateNode({
                          ...node,
                          choices: node.choices.filter((entry) => entry.id !== choice.id),
                        })
                      }
                    >
                      {t('Választás törlése', 'Delete choice')}
                    </button>
                  </fieldset>
                ))}
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() =>
                    updateNode({
                      ...node,
                      choices: [
                        ...node.choices,
                        {
                          id: nextId(
                            `${node.id}_choice`,
                            story.nodes.flatMap((entry) =>
                              entry.kind === 'scene' ? entry.choices.map(({ id }) => id) : [],
                            ),
                          ),
                          text: t('Új választás', 'New choice'),
                          target: story.startNodeId,
                        },
                      ],
                    })
                  }
                >
                  {t('Választás hozzáadása', 'Add choice')}
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn--danger"
              disabled={node.id === story.startNodeId || node.id === story.deathEndingId}
              onClick={() => {
                updateStory({ nodes: story.nodes.filter((entry) => entry.id !== node.id) });
                setDraft((d) => ({
                  ...d,
                  illustrations: Object.fromEntries(
                    Object.entries(d.illustrations).filter(([id]) => id !== node.id),
                  ),
                }));
                setSelected(story.startNodeId);
              }}
            >
              {t('Csomópont törlése', 'Delete node')}
            </button>
          </section>
        )}
      </div>
      <details className="editor-details">
        <summary>
          {t(
            'Haladó adatok: karakterek, tárgyak, feltételek és fordítások',
            'Advanced data: heroes, items, conditions and translations',
          )}
        </summary>
        {advanced === undefined ? (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setAdvanced(JSON.stringify(adventureFiles(draft), null, 2))}
          >
            {t('JSON megnyitása', 'Open JSON')}
          </button>
        ) : (
          <>
            <Field label={t('Csomag JSON', 'Package JSON')}>
              <textarea rows={20} value={advanced} onChange={(e) => setAdvanced(e.target.value)} />
            </Field>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                try {
                  setDraft(parseAdventure(JSON.parse(advanced), draft.images));
                  setAdvanced(undefined);
                  setError('');
                } catch (err) {
                  setError(String(err));
                }
              }}
            >
              {t('Alkalmazás', 'Apply')}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setAdvanced(undefined)}
            >
              {t('Bezárás', 'Close')}
            </button>
          </>
        )}
      </details>
    </main>
  );
}

function nextId(prefix: string, ids: string[]): string {
  let number = 1;
  while (ids.includes(`${prefix}_${number}`)) number += 1;
  return `${prefix}_${number}`;
}

async function importIfBuiltIn(adventure: Adventure, builtIn: boolean): Promise<Adventure> {
  if (!builtIn) return adventure;
  return importAdventure(await exportAdventure(adventure));
}
