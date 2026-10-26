import { theme } from '../theme';
import type { ImageValue, RenderContext } from '../templates/types';

type Ctx = CanvasRenderingContext2D;

export interface FontSpec {
  family?: string;
  weight?: number | string;
  size: number;
}

export function setFont(ctx: Ctx, f: FontSpec) {
  const family = f.family ?? theme.fonts.body;
  ctx.font = `${f.weight ?? 400} ${Math.round(f.size)}px "${family}", Arial, sans-serif`;
}

export function setSpacing(ctx: Ctx, px: number) {
  // Niet elke browser ondersteunt letterSpacing op canvas; dan negeren.
  const c = ctx as Ctx & { letterSpacing?: string };
  if ('letterSpacing' in c) c.letterSpacing = `${px}px`;
}

/** Verkleint de lettergrootte tot de tekst binnen maxWidth past. */
export function fitSize(ctx: Ctx, text: string, maxWidth: number, f: FontSpec, minSize = 12): number {
  let size = f.size;
  setFont(ctx, { ...f, size });
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= Math.max(1, size * 0.04);
    setFont(ctx, { ...f, size });
  }
  return size;
}

/** Breekt tekst af op woorden; respecteert harde regeleindes. */
export function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = `${line} ${words[i]}`;
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else {
        out.push(line);
        line = words[i];
      }
    }
    out.push(line);
  }
  return out;
}

/** Zoekt de grootste lettergrootte waarbij tekst in maxLines regels past. */
export function fitWrapped(
  ctx: Ctx,
  text: string,
  maxWidth: number,
  maxLines: number,
  f: FontSpec,
  minSize = 14,
): { size: number; lines: string[] } {
  let size = f.size;
  for (;;) {
    setFont(ctx, { ...f, size });
    const lines = wrap(ctx, text, maxWidth);
    const tooWide = lines.some((l) => ctx.measureText(l).width > maxWidth);
    if ((lines.length <= maxLines && !tooWide) || size <= minSize) {
      if (lines.length > maxLines) {
        const kept = lines.slice(0, maxLines);
        kept[maxLines - 1] = ellipsize(ctx, kept[maxLines - 1] + '…', maxWidth);
        return { size, lines: kept };
      }
      return { size, lines };
    }
    size -= Math.max(1, size * 0.05);
  }
}

function ellipsize(ctx: Ctx, text: string, maxWidth: number): string {
  let t = text;
  while (t.length > 1 && ctx.measureText(t).width > maxWidth) t = t.slice(0, -2) + '…';
  return t;
}

export interface TextOpts extends FontSpec {
  color: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
  minSize?: number;
  spacing?: number;
  shadow?: boolean;
}

/** Tekent één regel tekst, verkleint automatisch als maxWidth gegeven is. Geeft gebruikte grootte terug. */
export function text(ctx: Ctx, value: string, x: number, y: number, o: TextOpts): number {
  ctx.save();
  setSpacing(ctx, o.spacing ?? 0);
  const size = o.maxWidth ? fitSize(ctx, value, o.maxWidth, o, o.minSize) : o.size;
  setFont(ctx, { ...o, size });
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.baseline ?? 'alphabetic';
  if (o.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.25;
    ctx.shadowOffsetY = size * 0.05;
  }
  ctx.fillText(value, x, y);
  ctx.restore();
  return size;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Tekent een afbeelding vullend in het vak, met zoom en focuspunt. */
export function drawCover(
  ctx: Ctx,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  iv?: Pick<ImageValue, 'zoom' | 'x' | 'y'> | null,
) {
  const zoom = Math.max(0.2, iv?.zoom ?? 1);
  const fx = iv?.x ?? 0.5;
  const fy = iv?.y ?? 0.5;
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight) * zoom;
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const dx = x + (w - dw) * fx;
  const dy = y + (h - dh) * fy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.restore();
}

/** Tekent een afbeelding passend (zonder bijsnijden) gecentreerd in het vak. */
export function drawContain(ctx: Ctx, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Effen achtergrond in clubstijl met diagonale strepen. */
export function patternBackground(rc: RenderContext) {
  const { ctx, W, H, pal } = rc;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, pal.bg);
  g.addColorStop(1, pal.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Subtiele verticale banen, als de streep in het clublogo
  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = pal.fg;
  const band = W / 9;
  for (let x = band; x < W; x += band * 2) ctx.fillRect(x, 0, band, H);
  ctx.restore();

  // Accentbalk rechtsboven
  ctx.save();
  ctx.fillStyle = pal.accent;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(W * 0.72, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, W * 0.06);
  ctx.lineTo(W * 0.72 + W * 0.06, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Achtergrond: foto (indien aanwezig) met donkere laag, anders het clubpatroon.
 * `fade` bepaalt of de laag onderaan sterker is (voor tekst onderin).
 */
export function background(rc: RenderContext, key: string, iv: ImageValue | null, fade: 'bottom' | 'even' = 'bottom') {
  const { ctx, W, H, design } = rc;
  const image = rc.images[key];
  if (!image) {
    patternBackground(rc);
    return false;
  }
  // Clubachtergrond eronder: zichtbaar bij uitzoomen of een foto zonder achtergrond.
  patternBackground(rc);
  drawCover(ctx, image, 0, 0, W, H, iv);
  const o = design.overlay;
  if (fade === 'even') {
    ctx.fillStyle = `rgba(0,0,0,${o})`;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(0,0,0,${o * 0.55})`);
    g.addColorStop(0.35, `rgba(0,0,0,${o * 0.15})`);
    g.addColorStop(0.6, `rgba(0,0,0,${o * 0.6})`);
    g.addColorStop(1, `rgba(0,0,0,${Math.min(1, o * 1.6)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  return true;
}

export function drawClubLogo(rc: RenderContext, x: number, y: number, size: number) {
  if (!rc.logo || !rc.design.showLogo) return;
  drawContain(rc.ctx, rc.logo, x, y, size, size);
}

/** Rond embleem met initialen als er geen logo is. */
export function initialsBadge(rc: RenderContext, name: string, cx: number, cy: number, r: number) {
  const { ctx, pal } = rc;
  const initials =
    name
      .replace(/^(vv|sv|vsv|fc|sc|cvv|rkvv|vvv)\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?';
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = r * 0.08;
  ctx.strokeStyle = pal.accent;
  ctx.stroke();
  ctx.restore();
  text(ctx, initials, cx, cy, {
    size: r * 0.9,
    family: theme.fonts.heading,
    color: theme.colors.primaryDark,
    align: 'center',
    baseline: 'middle',
    maxWidth: r * 1.5,
  });
}

/** Logo in een witte cirkel (voor clublogo's van tegenstanders). */
export function logoBadge(rc: RenderContext, image: HTMLImageElement, cx: number, cy: number, r: number) {
  const { ctx } = rc;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = r * 0.2;
  ctx.fill();
  ctx.restore();
  const inner = r * 1.45;
  drawContain(ctx, image, cx - inner / 2, cy - inner / 2, inner, inner);
}

export function footer(rc: RenderContext, color?: string) {
  if (!theme.footer) return;
  const { ctx, W, H, pal } = rc;
  text(ctx, theme.footer.toUpperCase(), W / 2, H - W * 0.045, {
    size: W * 0.026,
    family: theme.fonts.condensed,
    weight: 500,
    color: color ?? pal.muted,
    align: 'center',
    spacing: 4,
  });
}

/** Kop met logo linksboven, gebruikt door meerdere templates. */
export function header(rc: RenderContext, title: string, subtitle: string, top: number, onPhoto = false) {
  const color = onPhoto ? '#ffffff' : undefined;
  const { ctx, W, design, pal } = rc;
  const s = design.textScale;
  const pad = W * 0.07;
  const logoSize = W * 0.15;
  let textX = pad;
  if (rc.logo && design.showLogo) {
    drawClubLogo(rc, pad, top, logoSize);
    textX = pad + logoSize + W * 0.035;
  }
  const maxW = W - textX - pad;
  const titleSize = text(ctx, title.toUpperCase(), textX, top + logoSize * 0.66, {
    size: W * 0.105 * s,
    family: theme.fonts.heading,
    color: color ?? pal.fg,
    maxWidth: maxW,
    minSize: 30,
    spacing: 1,
  });
  if (subtitle) {
    text(ctx, subtitle.toUpperCase(), textX, top + logoSize * 0.66 + titleSize * 0.55, {
      size: W * 0.036 * s,
      family: theme.fonts.condensed,
      weight: 600,
      color: onPhoto ? pal.accentOnPhoto : pal.accent,
      maxWidth: maxW,
      spacing: 3,
    });
  }
  return top + logoSize;
}

const dayFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
const shortFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });

function parseIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** "2026-11-01" → "zondag 1 november" (of de invoer zelf als het geen datum is). */
export function formatDate(iso: string, style: 'long' | 'short' = 'long'): string {
  const d = parseIso(iso);
  if (!d) return iso;
  return (style === 'long' ? dayFmt : shortFmt).format(d).replace(/\./g, '');
}
