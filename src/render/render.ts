import { formats } from '../formats';
import { palette, theme } from '../theme';
import type { Design, TemplateData, TemplateDef } from '../templates/types';

const cache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Afbeelding kon niet geladen worden'));
      im.src = src;
    });
    cache.set(src, p);
    p.catch(() => cache.delete(src));
  }
  return p;
}

export function loadLogo(): Promise<HTMLImageElement | undefined> {
  return loadImage(import.meta.env.BASE_URL + theme.logoUrl).catch(() => undefined);
}

let fontsPromise: Promise<void> | null = null;

/** Wacht tot de lettertypes geladen zijn, anders tekent canvas met een fallback-font. */
export function fontsReady(): Promise<void> {
  if (!fontsPromise) {
    const { heading, condensed, body } = theme.fonts;
    const specs = [
      `40px "${heading}"`,
      `500 40px "${condensed}"`,
      `600 40px "${condensed}"`,
      `700 40px "${condensed}"`,
      `400 40px "${body}"`,
      `500 40px "${body}"`,
      `600 40px "${body}"`,
    ];
    fontsPromise = Promise.all(specs.map((s) => document.fonts.load(s, 'AaÉé0123'))).then(() => undefined);
  }
  return fontsPromise;
}

export function renderTemplate(
  canvas: HTMLCanvasElement,
  tpl: TemplateDef,
  data: TemplateData,
  design: Design,
  images: Record<string, HTMLImageElement | undefined>,
  logo?: HTMLImageElement,
) {
  const format = formats[design.format];
  if (canvas.width !== format.width) canvas.width = format.width;
  if (canvas.height !== format.height) canvas.height = format.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.clearRect(0, 0, format.width, format.height);
  tpl.draw(
    {
      ctx,
      W: format.width,
      H: format.height,
      format,
      design,
      pal: palette(design.variant),
      images,
      logo,
    },
    data,
  );
  ctx.restore();
}
