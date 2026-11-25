import heroesRaw from '../../content/heroes.json';
import itemsRaw from '../../content/items.json';
import nodesRaw from '../../content/nodes.json';
import { heroesSchema, itemsSchema, storySchema } from '../engine/schema';
import { validateContent, type Content } from '../engine/validate';

let cachedContent: Content | null = null;

/** Betölti és validálja a történetgráf JSON fájljait. */
export function loadGameContent(): Content {
  if (cachedContent) return cachedContent;

  const heroes = heroesSchema.parse(heroesRaw);
  const items = itemsSchema.parse(itemsRaw);
  const story = storySchema.parse(nodesRaw);
  const content: Content = { heroes, items, story };

  const errors = validateContent(content);
  if (errors.length > 0) {
    throw new Error(
      `Érvénytelen játéktartalom:\n${errors.map((e) => `- ${e.path}: ${e.message}`).join('\n')}`,
    );
  }

  cachedContent = content;
  return content;
}
