const images = import.meta.glob<string>('./portraits/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
});

export function portraitUrl(reference: string | undefined): string | undefined {
  if (!reference) return undefined;
  return reference.startsWith('preset:')
    ? images[`./portraits/${reference.slice(7)}.webp`]
    : reference;
}

export async function uploadPortrait(file: File): Promise<string> {
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  ) {
    throw new Error('JPEG / PNG / WebP · max. 8 MB');
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 16_000_000) throw new Error('Max. 16 MP');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 320;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image rendering is unavailable.');
    const edge = Math.min(bitmap.width, bitmap.height);
    context.fillStyle = '#17161a';
    context.fillRect(0, 0, 320, 320);
    context.drawImage(
      bitmap,
      (bitmap.width - edge) / 2,
      (bitmap.height - edge) / 2,
      edge,
      edge,
      0,
      0,
      320,
      320,
    );
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    bitmap.close();
  }
}
