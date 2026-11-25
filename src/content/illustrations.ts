import { z } from 'zod';
import illustrationsRaw from '../../content/illustrations.json';
import { idSchema } from '../engine/schema';

export const illustrationEntrySchema = z.strictObject({
  nodeId: idSchema,
  file: z.string().min(1),
  alt: z.string().min(1),
  prompt: z.string().min(1),
});

export const illustrationsSchema = z.array(illustrationEntrySchema);
export type IllustrationEntry = z.infer<typeof illustrationEntrySchema>;

let cachedMap: Map<string, IllustrationEntry> | null = null;

function getMap(): Map<string, IllustrationEntry> {
  if (!cachedMap) {
    const parsed = illustrationsSchema.parse(illustrationsRaw);
    cachedMap = new Map(parsed.map((entry) => [entry.nodeId, entry]));
  }
  return cachedMap;
}

export function getIllustration(nodeId: string): { url: string; alt: string } | undefined {
  const entry = getMap().get(nodeId);
  if (!entry) return undefined;
  return {
    url: `${import.meta.env.BASE_URL}images/${entry.file}`,
    alt: entry.alt,
  };
}
