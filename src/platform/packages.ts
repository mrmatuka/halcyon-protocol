import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { adventureFiles, imagePath, parseAdventure, type Adventure } from './adventure';

const jsonPaths = {
  manifest: 'manifest.json',
  heroes: 'heroes.json',
  items: 'items.json',
  nodes: 'nodes.json',
  illustrations: 'illustrations.json',
  translations: 'translations.json',
} as const;
const sizeLimit = 32 * 1024 * 1024;
const mediaType = (name: string) =>
  /\.png$/i.test(name) ? 'image/png' : /\.webp$/i.test(name) ? 'image/webp' : 'image/jpeg';

export async function importAdventure(file: Blob): Promise<Adventure> {
  if (file.size > sizeLimit) throw new Error('ZIP: max. 32 MB.');
  let total = 0;
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter({ name, originalSize }) {
      if (
        !Object.values(jsonPaths).some((path) => path === name) &&
        !imagePath.safeParse(name).success
      )
        return false;
      total += originalSize;
      if (total > sizeLimit) throw new Error('ZIP: max. 32 MB uncompressed.');
      return true;
    },
  });
  function read(path: string): unknown {
    return entries[path] ? JSON.parse(strFromU8(entries[path]).replace(/^\uFEFF/, '')) : undefined;
  }
  const images = Object.fromEntries(
    await Promise.all(
      Object.entries(entries)
        .filter(([path]) => imagePath.safeParse(path).success)
        .map(async ([path, bytes]) => {
          const blob = new Blob([Uint8Array.from(bytes)], { type: mediaType(path) });
          const encoded = await encodeImage(blob);
          return [path, encoded];
        }),
    ),
  );
  return parseAdventure(
    {
      manifest: read(jsonPaths.manifest),
      heroes: read(jsonPaths.heroes),
      items: read(jsonPaths.items),
      nodes: read(jsonPaths.nodes),
      illustrations: read(jsonPaths.illustrations),
      translations: read(jsonPaths.translations),
    },
    images,
  );
}

export async function encodeImage(blob: Blob): Promise<string> {
  if (blob.size > 8 * 1024 * 1024) throw new Error('Image: max. 8 MB.');
  const bitmap = await createImageBitmap(blob);
  const pixels = bitmap.width * bitmap.height;
  bitmap.close();
  if (pixels > 16000000) throw new Error('Image: max. 16 megapixels.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function exportAdventure(adventure: Adventure): Promise<Blob> {
  const files = adventureFiles(adventure);
  const entries = Object.fromEntries(
    Object.entries(jsonPaths).map(([key, path]) => [
      path,
      strToU8(JSON.stringify(files[key as keyof typeof jsonPaths], null, 2) + '\n'),
    ]),
  );
  for (const [path, url] of Object.entries(adventure.images)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to read image: ${path}`);
    entries[path] = new Uint8Array(await response.arrayBuffer());
  }
  return new Blob([Uint8Array.from(zipSync(entries))], { type: 'application/zip' });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kalandjatek-platform', 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('adventures', { keyPath: 'manifest.id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listImportedAdventures(): Promise<Adventure[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('adventures', 'readonly');
    const request = transaction.objectStore('adventures').getAll();
    transaction.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function saveImportedAdventure(adventure: Adventure): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('adventures', 'readwrite');
    transaction.objectStore('adventures').put(adventure);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
