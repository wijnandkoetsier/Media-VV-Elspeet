import { theme } from '../theme';
import { text } from '../render/canvasUtils';
import type { RenderContext } from './types';

export interface Rows {
  rowH: number;
  gap: number;
  /** y-positie van rij i. */
  y: (i: number) => number;
}

/** Verdeelt n rijen over de beschikbare hoogte; rijen worden niet hoger dan maxRowH. */
export function rows(rc: RenderContext, n: number, top: number, bottom: number): Rows {
  const { W } = rc;
  const count = Math.max(1, n);
  const maxRowH = W * (rc.H > W * 1.5 ? 0.17 : 0.15);
  const gapRatio = 0.16;
  const avail = bottom - top;
  const rowH = Math.min(maxRowH, avail / (count + (count - 1) * gapRatio));
  const gap = rowH * gapRatio;
  const used = count * rowH + (count - 1) * gap;
  // Iets boven het midden van de beschikbare ruimte.
  const start = top + (avail - used) * 0.4;
  return { rowH, gap, y: (i) => start + i * (rowH + gap) };
}

export function emptyHint(rc: RenderContext, msg: string, y: number) {
  text(rc.ctx, msg, rc.W / 2, y, {
    size: rc.W * 0.035,
    color: rc.pal.muted,
    align: 'center',
  });
}

/** Kaartkleur voor rijen; op een foto met de lichte variant een (half)dekkende clubkleur. */
export function cardColor(rc: RenderContext, hasPhoto: boolean): string {
  if (hasPhoto && rc.design.variant === 'secondary') return withAlpha(theme.colors.primary, 0.85);
  return rc.pal.card;
}

function withAlpha(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
