import { playerStorage, type KeyValueStorage } from '../persistence/playerStorage';
import { z } from 'zod';
import { heroPortraitSchema, type Hero, type Stats } from '../engine/schema';
import type { Content } from '../engine/validate';
import type { AdventureManifest, Locale } from './adventure';

export const attributes = ['agility', 'knowledge', 'resolve', 'presence'] as const;
export type Attribute = (typeof attributes)[number];
export const attributeLabels = {
  agility: { hu: 'Mozgékonyság', en: 'Agility' },
  knowledge: { hu: 'Tudás', en: 'Knowledge' },
  resolve: { hu: 'Elszántság', en: 'Resolve' },
  presence: { hu: 'Jelenlét', en: 'Presence' },
};

export const classes = {
  scout: {
    hu: 'Felderítő',
    en: 'Scout',
    stat: 'agility',
    ability: { hu: 'Gyors reakció', en: 'Quick Response' },
  },
  scholar: {
    hu: 'Tudós',
    en: 'Scholar',
    stat: 'knowledge',
    ability: { hu: 'Biztos tudás', en: 'Field Expertise' },
  },
  guardian: {
    hu: 'Őrző',
    en: 'Guardian',
    stat: 'resolve',
    ability: { hu: 'Összeszedettség', en: 'Hold Fast' },
  },
  mediator: {
    hu: 'Közvetítő',
    en: 'Mediator',
    stat: 'presence',
    ability: { hu: 'Második megközelítés', en: 'Another Angle' },
  },
} as const;
export const classIds = ['scout', 'scholar', 'guardian', 'mediator'] as const;
export const traits = {
  nimble: { hu: 'Fürge', en: 'Nimble', stat: 'agility' },
  curious: { hu: 'Kíváncsi', en: 'Curious', stat: 'knowledge' },
  steady: { hu: 'Rendíthetetlen', en: 'Steady', stat: 'resolve' },
  charismatic: { hu: 'Megnyerő', en: 'Charismatic', stat: 'presence' },
} as const;
export const traitIds = ['nimble', 'curious', 'steady', 'charismatic'] as const;

export const pointBudget = 4;
export const attributeCap = 10;
const point = z.number().int().min(0).max(pointBudget);
const pointsSchema = z.strictObject({
  agility: point,
  knowledge: point,
  resolve: point,
  presence: point,
});
export type Points = z.infer<typeof pointsSchema>;
export const blankPoints: Points = { agility: 0, knowledge: 0, resolve: 0, presence: 0 };
const profileSchema = z
  .strictObject({
    id: z.string().regex(/^profile_[a-f0-9]+$/),
    name: z.string().trim().min(1).max(60),
    classId: z.enum(classIds),
    traitId: z.enum(traitIds),
    points: pointsSchema,
    portrait: heroPortraitSchema,
  })
  .refine(
    (profile) =>
      spentPoints(profile.points) <= pointBudget &&
      attributes.every((stat) => attributeValue(profile, stat) <= attributeCap),
    'The character exceeds its point budget or attribute cap.',
  );
export type Profile = z.infer<typeof profileSchema>;
const profilesSchema = z.strictObject({
  version: z.literal(1),
  profiles: z.array(profileSchema),
  defaultId: z.string().nullable(),
  assignments: z.record(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), z.string()),
});
export type Profiles = z.infer<typeof profilesSchema>;
const storageKey = 'kalandjatek:character-library';

export function spentPoints(points: Points): number {
  return attributes.reduce((total, stat) => total + points[stat], 0);
}

export function attributeValue(
  profile: { classId: keyof typeof classes; traitId: keyof typeof traits; points: Points },
  stat: Attribute,
): number {
  return (
    (classes[profile.classId].stat === stat ? 8 : 6) +
    profile.points[stat] +
    Number(traits[profile.traitId].stat === stat)
  );
}

export function rollPoints(
  profile: { classId: keyof typeof classes; traitId: keyof typeof traits },
  random = Math.random,
): Points {
  const points = { ...blankPoints };
  for (let i = 0; i < pointBudget; i += 1) {
    const eligible = attributes.filter(
      (stat) => attributeValue({ ...profile, points }, stat) < attributeCap,
    );
    points[eligible[Math.floor(random() * eligible.length)]] += 1;
  }
  return points;
}

export function readProfiles(storage: KeyValueStorage = playerStorage): Profiles {
  const raw = storage.getItem(storageKey);
  return raw === null
    ? { version: 1, profiles: [], defaultId: null, assignments: {} }
    : profilesSchema.parse(JSON.parse(raw));
}

export function writeProfiles(library: Profiles, storage: KeyValueStorage = playerStorage): void {
  storage.setItem(storageKey, JSON.stringify(profilesSchema.parse(library)));
}

export function assignedProfile(library: Profiles, adventureId: string): Profile | undefined {
  return (
    library.profiles.find(({ id }) => id === library.assignments[adventureId]) ??
    library.profiles.find(({ id }) => id === library.defaultId)
  );
}

const legacyStatMap: Record<string, Attribute> = {
  reflex: 'agility',
  speed: 'agility',
  agility: 'agility',
  stealth: 'agility',
  technika: 'knowledge',
  figyelem: 'knowledge',
  intellect: 'knowledge',
  knowledge: 'knowledge',
  kitartas: 'resolve',
  batorsag: 'resolve',
  willpower: 'resolve',
  resolve: 'resolve',
  szerencse: 'presence',
  charisma: 'presence',
  presence: 'presence',
};

export function adaptProfile(
  profile: Profile,
  manifest: AdventureManifest,
  content: Content,
  locale: Locale,
): Hero {
  const ability = classes[profile.classId];
  const statIds = Object.keys(manifest.statLabels).filter((id) => id !== 'eletero');
  const stats: Stats = { eletero: Math.max(1, average(content, 'eletero')) };
  const checked = new Set(
    content.story.nodes.flatMap((node) =>
      node.kind === 'scene'
        ? node.choices.flatMap((choice) => ('check' in choice ? [choice.check.stat] : []))
        : [],
    ),
  );
  const preferred: string[] = [];
  const secondary: string[] = [];
  for (const id of statIds) {
    const attribute =
      manifest.characterStatMap?.[id] ??
      (Object.hasOwn(legacyStatMap, id) ? legacyStatMap[id] : undefined);
    stats[id] = Math.max(
      0,
      average(content, id) + (attribute ? attributeValue(profile, attribute) - 7 : 0),
    );
    if (checked.has(id)) (attribute === ability.stat ? preferred : secondary).push(id);
  }
  const available = preferred.length ? preferred : secondary;
  const card: Hero['card'] = {
    id: `class_${profile.classId}`,
    name: ability.ability[locale],
    description: '',
    options: [],
  };
  if (profile.classId === 'guardian' || available.length === 0) {
    card.description =
      locale === 'hu' ? 'Egyszer visszatölt 3 életerőt.' : 'Restore 3 health once.';
    card.options = [{ type: 'heal', amount: 3 }];
  } else if (profile.classId === 'scholar') {
    card.description =
      locale === 'hu'
        ? 'Egy jelölt próbát automatikusan teljesít.'
        : 'Automatically pass one eligible check.';
    card.options = [{ type: 'autoSuccess', stats: available }];
  } else {
    card.description =
      locale === 'hu'
        ? 'Egy sikertelen, jelölt próbát újradobhatsz.'
        : 'Reroll one eligible failed check.';
    card.options = [{ type: 'reroll', stats: available }];
  }
  return {
    id: profile.id,
    name: profile.name,
    role: ability[locale],
    description: traits[profile.traitId][locale],
    stats,
    card,
    portrait: profile.portrait,
  };
}

function average(content: Content, stat: string): number {
  return Math.round(
    content.heroes.reduce((sum, hero) => sum + (hero.stats[stat] ?? 0), 0) / content.heroes.length,
  );
}
