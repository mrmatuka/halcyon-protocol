import {
  adventureManifestSchema,
  parseAdventure,
  type Adventure,
  type AdventureManifest,
} from './adventure';

const manifests = import.meta.glob<unknown>('/adventures/*/manifest.json', {
  eager: true,
  import: 'default',
});
const json = import.meta.glob<unknown>(['/adventures/*/*.json', '!/adventures/*/manifest.json'], {
  import: 'default',
});
const assets = import.meta.glob<string>('/adventures/*/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

export interface CatalogEntry {
  manifest: AdventureManifest;
  coverUrl?: string;
  load: () => Promise<Adventure>;
  builtIn: boolean;
}

export function builtInCatalog(): CatalogEntry[] {
  return Object.entries(manifests)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, data]) => {
      const manifest = adventureManifestSchema.parse(data);
      const directory = `/adventures/${manifest.id}/`;
      if (path !== directory + 'manifest.json')
        throw new Error(`Adventure ID and folder differ: ${path}`);
      let loaded: Promise<Adventure> | undefined;
      return {
        manifest,
        builtIn: true,
        coverUrl: manifest.cover && assets[directory + manifest.cover],
        load: () => {
          loaded ??= loadAdventure(directory, manifest).catch((error: unknown) => {
            loaded = undefined;
            throw error;
          });
          return loaded;
        },
      };
    });
}

async function loadAdventure(directory: string, manifest: AdventureManifest): Promise<Adventure> {
  const [heroes, items, nodes, illustrations, translations] = await Promise.all(
    ['heroes', 'items', 'nodes', 'illustrations', 'translations'].map((name) =>
      json[`${directory}${name}.json`]?.(),
    ),
  );
  const images = Object.fromEntries(
    Object.entries(assets)
      .filter(([path]) => path.startsWith(directory))
      .map(([path, url]) => [path.slice(directory.length), url]),
  );
  return parseAdventure({ manifest, heroes, items, nodes, illustrations, translations }, images);
}

export function importedCatalogEntry(adventure: Adventure): CatalogEntry {
  const { manifest, images } = adventure;
  return {
    manifest,
    builtIn: false,
    coverUrl: manifest.cover && images[manifest.cover],
    load: () => Promise.resolve(adventure),
  };
}
