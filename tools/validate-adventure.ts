import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAdventure } from '../src/platform/adventure';

const directory = process.argv[2];
if (!directory) {
  console.error('Usage: npm run validate:adventure -- adventures/<id>');
  process.exit(1);
}

function readJson(name: string, optional = false): unknown {
  try {
    return JSON.parse(readFileSync(join(directory, name + '.json'), 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    if (optional && (error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

try {
  const directoryImages = readdirSync(join(directory), { withFileTypes: true }).some(
    (entry) => entry.isDirectory() && entry.name === 'images',
  )
    ? readdirSync(join(directory, 'images'), { withFileTypes: true })
    : [];
  const images = Object.fromEntries(
    directoryImages
      .filter((entry) => entry.isFile())
      .map(({ name }) => [`images/${name}`, join(directory, 'images', name)]),
  );
  const adventure = parseAdventure(
    {
      manifest: readJson('manifest'),
      heroes: readJson('heroes'),
      items: readJson('items'),
      nodes: readJson('nodes'),
      illustrations: readJson('illustrations', true),
      translations: readJson('translations', true),
    },
    images,
  );
  console.log(`OK: ${adventure.manifest.id}, ${adventure.content.story.nodes.length} nodes.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
