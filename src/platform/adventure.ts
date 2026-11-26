import { z } from 'zod';
import { heroesSchema, idSchema, itemsSchema, storySchema } from '../engine/schema';
import { validateStoryGraph } from '../../tools/lib/graphValidator';
import { validateContent, type Content } from '../engine/validate';

export type Locale = 'hu' | 'en';
const text = z.string().trim().min(1);
const labels = z.strictObject({ hu: text, en: text.optional() });
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const imagePath = z.string().regex(/^images\/[a-z0-9][a-z0-9_.-]*\.(png|jpe?g|webp)$/i);
export const adventureManifestSchema = z.strictObject({
  version: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: labels,
  description: labels,
  genre: labels,
  difficulty: z.enum(['easy', 'normal', 'hard']),
  minutes: z.number().int().positive(),
  defaultLocale: z.enum(['hu', 'en']),
  statLabels: z.record(idSchema, labels),
  theme: z.strictObject({
    background: hex,
    surface: hex,
    accent: hex,
    text: hex,
    font: z.enum(['system', 'serif', 'mono']),
  }),
  characterMode: z.enum(['preset', 'custom', 'both']),
  cover: imagePath.optional(),
});
export type AdventureManifest = z.infer<typeof adventureManifestSchema>;
export const translationsSchema = z.record(z.string(), z.string());
const illustrationSchema = z.object({
  nodeId: idSchema,
  file: z.string(),
  alt: text,
  prompt: z.string().optional(),
});

export const illustrationsSchema = z.array(illustrationSchema);

export interface AdventureFiles {
  manifest: unknown;
  heroes: unknown;
  items: unknown;
  nodes: unknown;
  illustrations?: unknown;
  translations?: unknown;
}
export interface Adventure {
  manifest: AdventureManifest;
  content: Content;
  translations: Record<string, string>;
  illustrations: Record<string, { path: string; alt: string }>;
  images: Record<string, string>;
}

export function parseAdventure(
  files: AdventureFiles,
  images: Record<string, string> = {},
): Adventure {
  const manifest = adventureManifestSchema.parse(files.manifest);
  const content: Content = {
    heroes: heroesSchema.parse(files.heroes),
    items: itemsSchema.parse(files.items),
    story: storySchema.parse(files.nodes),
  };
  if (!content.heroes.length)
    throw new Error('At least one hero or character archetype is required.');
  const errors = validateContent(content, Object.keys(manifest.statLabels));
  if (errors.length)
    throw new Error(errors.map(({ path, message }) => `${path}: ${message}`).join('\n'));
  const graph = validateStoryGraph(content);
  if (graph.length) throw new Error(graph.map(({ message }) => message).join('\n'));
  const illustrations = Object.fromEntries(
    illustrationsSchema
      .parse(files.illustrations ?? [])
      .map((entry) => [
        entry.nodeId,
        { path: imagePath.parse(`images/${entry.file}`), alt: entry.alt },
      ]),
  );
  for (const [id, image] of Object.entries(illustrations)) {
    if (!content.story.nodes.some((node) => node.id === id) || !Object.hasOwn(images, image.path)) {
      throw new Error(`Invalid illustration: ${id} → ${image.path}`);
    }
  }
  if (manifest.cover && !Object.hasOwn(images, manifest.cover))
    throw new Error('Cover image missing.');
  const usedImages = new Set(Object.values(illustrations).map(({ path }) => path));
  if (manifest.cover) usedImages.add(manifest.cover);
  const referenced = Object.fromEntries(
    Object.entries(images).filter(([path]) => usedImages.has(path)),
  );
  return {
    manifest,
    content,
    translations: translationsSchema.parse(files.translations ?? {}),
    illustrations,
    images: referenced,
  };
}

export function localizedContent(adventure: Adventure, locale: Locale): Content {
  const strings = locale === adventure.manifest.defaultLocale ? {} : adventure.translations;
  const label = (key: string, original: string) => (strings[key]?.trim() ? strings[key] : original);
  const { heroes, items, story } = adventure.content;
  return {
    heroes: heroes.map((hero) => ({
      ...hero,
      name: label(`hero.${hero.id}.name`, hero.name),
      role: label(`hero.${hero.id}.role`, hero.role),
      description: label(`hero.${hero.id}.description`, hero.description),
      card: {
        ...hero.card,
        name: label(`card.${hero.card.id}.name`, hero.card.name),
        description: label(`card.${hero.card.id}.description`, hero.card.description),
      },
    })),
    items: items.map((item) => ({
      ...item,
      name: label(`item.${item.id}.name`, item.name),
      description: label(`item.${item.id}.description`, item.description),
    })),
    story: {
      ...story,
      nodes: story.nodes.map((node) => {
        const localized = {
          title: label(`node.${node.id}.title`, node.title),
          text: label(`node.${node.id}.text`, node.text),
        };
        return node.kind === 'scene'
          ? {
              ...node,
              ...localized,
              choices: node.choices.map((choice) => ({
                ...choice,
                text: label(`choice.${choice.id}`, choice.text),
              })),
            }
          : { ...node, ...localized };
      }),
    },
  };
}

export function localizedLabel(label: { hu: string; en?: string }, locale: Locale): string {
  return label[locale] ?? label.hu;
}

export function adventureFiles(adventure: Adventure): AdventureFiles {
  return {
    manifest: adventure.manifest,
    heroes: adventure.content.heroes,
    items: adventure.content.items,
    nodes: adventure.content.story,
    translations: adventure.translations,
    illustrations: Object.entries(adventure.illustrations).map(([nodeId, { path, alt }]) => ({
      nodeId,
      file: path.slice('images/'.length),
      alt,
    })),
  };
}
