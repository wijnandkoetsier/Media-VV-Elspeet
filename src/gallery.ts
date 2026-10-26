import { del, get, set, update } from 'idb-keyval';

/**
 * Galerij: alle geüploade afbeeldingen, bewaard op het toestel (IndexedDB).
 * De index bevat kleine miniaturen voor een snel overzicht; de volledige afbeelding
 * staat apart en wordt pas geladen als je hem kiest.
 */
export interface GalleryItem {
  id: string;
  name: string;
  /** Transparante afbeelding (logo of uitgeknipte foto). */
  transparent: boolean;
  thumb: string;
  created: number;
  /** Hash van de inhoud, om dubbele opslag te voorkomen. */
  hash: string;
}

const INDEX = 'gallery:index';
const itemKey = (id: string) => `gallery:img:${id}`;
const MAX_ITEMS = 300;

const listeners = new Set<() => void>();
export function onGalleryChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
const notify = () => listeners.forEach((fn) => fn());

export async function listGallery(): Promise<GalleryItem[]> {
  try {
    return (await get<GalleryItem[]>(INDEX)) ?? [];
  } catch {
    return [];
  }
}

export async function getGallerySrc(id: string): Promise<string | undefined> {
  return get<string>(itemKey(id));
}

async function hashOf(src: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(src));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Geen crypto (bijv. http zonder s): eenvoudige vingerafdruk.
    return `${src.length}:${src.slice(-64)}`;
  }
}

function makeThumb(src: string, transparent: boolean): Promise<string> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      const max = 320;
      const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.naturalWidth * s));
      c.height = Math.max(1, Math.round(im.naturalHeight * s));
      c.getContext('2d')?.drawImage(im, 0, 0, c.width, c.height);
      // WebP ondersteunt transparantie en is klein; browsers zonder WebP-export geven PNG terug.
      resolve(transparent ? c.toDataURL('image/webp', 0.85) : c.toDataURL('image/jpeg', 0.8));
    };
    im.onerror = () => resolve(src);
    im.src = src;
  });
}

/** Voegt een afbeelding toe (of verplaatst een bestaande naar voren). Fouten worden genegeerd. */
export async function addToGallery(src: string, name: string): Promise<void> {
  try {
    const hash = await hashOf(src);
    const existing = (await listGallery()).find((i) => i.hash === hash);
    if (existing) {
      await update<GalleryItem[]>(INDEX, (list = []) => [
        { ...existing, created: Date.now() },
        ...list.filter((i) => i.id !== existing.id),
      ]);
      notify();
      return;
    }
    const transparent = src.startsWith('data:image/png') || src.startsWith('data:image/webp');
    const item: GalleryItem = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      name: name.replace(/\.[a-z0-9]+$/i, '') || 'Afbeelding',
      transparent,
      thumb: await makeThumb(src, transparent),
      created: Date.now(),
      hash,
    };
    await set(itemKey(item.id), src);
    let dropped: GalleryItem[] = [];
    await update<GalleryItem[]>(INDEX, (list = []) => {
      const next = [item, ...list];
      dropped = next.slice(MAX_ITEMS);
      return next.slice(0, MAX_ITEMS);
    });
    await Promise.all(dropped.map((d) => del(itemKey(d.id))));
    // Vraag de browser de opslag niet zomaar op te ruimen.
    navigator.storage?.persist?.().catch(() => undefined);
    notify();
  } catch {
    /* Galerij is een gemak; uploaden werkt ook zonder. */
  }
}

export async function renameGalleryItem(id: string, name: string) {
  await update<GalleryItem[]>(INDEX, (list = []) => list.map((i) => (i.id === id ? { ...i, name } : i)));
  notify();
}

export async function removeFromGallery(id: string) {
  await update<GalleryItem[]>(INDEX, (list = []) => list.filter((i) => i.id !== id));
  await del(itemKey(id));
  notify();
}
