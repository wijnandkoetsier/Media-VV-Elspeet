import { theme } from '../theme';
import {
  background,
  fillRound,
  footer,
  formatDate,
  header,
  initialsBadge,
  logoBadge,
  text,
} from '../render/canvasUtils';
import { nextSaturday } from './dates';
import { img, str, type RenderContext, type TemplateDef } from './types';

function teamBadge(rc: RenderContext, name: string, key: string, cx: number, cy: number, r: number) {
  const uploaded = rc.images[key];
  if (uploaded) logoBadge(rc, uploaded, cx, cy, r);
  else if (/elspeet/i.test(name) && rc.logo) logoBadge(rc, rc.logo, cx, cy, r);
  else initialsBadge(rc, name, cx, cy, r);
}

export const matchday: TemplateDef = {
  id: 'matchday',
  name: 'Matchday',
  description: 'Aankondiging van de wedstrijd',
  emoji: '⚽',
  fields: [
    { key: 'thuis', label: 'Thuisploeg', type: 'text', placeholder: 'VV Elspeet 1' },
    { key: 'uit', label: 'Uitploeg', type: 'text', placeholder: 'Tegenstander' },
    { key: 'datum', label: 'Datum', type: 'date' },
    { key: 'tijd', label: 'Aftrap', type: 'time' },
    { key: 'locatie', label: 'Locatie', type: 'text', placeholder: 'Sportpark ...' },
    { key: 'competitie', label: 'Competitie / klasse', type: 'text', placeholder: 'Competitie' },
    { key: 'foto', label: 'Achtergrondfoto', type: 'image' },
    {
      key: 'logoThuis',
      label: 'Logo thuisploeg',
      type: 'image',
      alpha: true,
      hint: 'Leeg = clublogo (bij VV Elspeet) of initialen',
    },
    { key: 'logoUit', label: 'Logo uitploeg', type: 'image', alpha: true, hint: 'Leeg = initialen' },
  ],
  defaults: {
    thuis: 'VV Elspeet 1',
    uit: 'Tegenstander',
    datum: nextSaturday(),
    tijd: '14:30',
    locatie: 'Sportpark Elspeet',
    competitie: 'Competitie',
    foto: null,
    logoThuis: null,
    logoUit: null,
  },
  draw(rc, d) {
    const { ctx, W, H, pal, design } = rc;
    const s = design.textScale;
    const pad = W * 0.07;
    const hasPhoto = background(rc, 'foto', img(d, 'foto'));
    const fg = hasPhoto ? '#ffffff' : pal.fg;

    header(rc, 'Matchday', str(d, 'competitie'), H * 0.045, hasPhoto);

    // Infokaart onderaan
    const infoH = W * 0.21;
    const infoY = H - W * 0.1 - infoH;
    fillRound(ctx, pad, infoY, W - pad * 2, infoH, W * 0.03, pal.accent);
    const split = pad + (W - pad * 2) * 0.64;
    ctx.fillStyle = pal.accentFg;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(split, infoY + infoH * 0.18, 3, infoH * 0.64);
    ctx.globalAlpha = 1;
    const leftW = split - pad - W * 0.08;
    text(ctx, formatDate(str(d, 'datum')).toUpperCase(), pad + W * 0.045, infoY + infoH * 0.44, {
      size: W * 0.048 * s,
      family: theme.fonts.condensed,
      weight: 700,
      color: pal.accentFg,
      maxWidth: leftW,
    });
    text(ctx, str(d, 'locatie'), pad + W * 0.045, infoY + infoH * 0.74, {
      size: W * 0.034 * s,
      weight: 500,
      color: pal.accentFg,
      maxWidth: leftW,
    });
    const rightCx = (split + W - pad) / 2;
    const rightW = W - pad - split - W * 0.05;
    text(ctx, 'AFTRAP', rightCx, infoY + infoH * 0.34, {
      size: W * 0.026,
      family: theme.fonts.condensed,
      weight: 600,
      color: pal.accentFg,
      align: 'center',
      spacing: 4,
    });
    text(ctx, str(d, 'tijd') || '--:--', rightCx, infoY + infoH * 0.8, {
      size: W * 0.095 * s,
      family: theme.fonts.heading,
      color: pal.accentFg,
      align: 'center',
      maxWidth: rightW,
    });

    // Teams
    const r = W * (H > W * 1.5 ? 0.15 : 0.125);
    const nameY = infoY - W * 0.06;
    const nameSize = W * 0.044 * s;
    const cy = nameY - nameSize - W * 0.03 - r;
    const homeX = W * 0.25;
    const awayX = W * 0.75;
    teamBadge(rc, str(d, 'thuis'), 'logoThuis', homeX, cy, r);
    teamBadge(rc, str(d, 'uit'), 'logoUit', awayX, cy, r);
    text(ctx, 'VS', W / 2, cy, {
      size: W * 0.085,
      family: theme.fonts.heading,
      color: hasPhoto ? pal.accentOnPhoto : pal.accent,
      align: 'center',
      baseline: 'middle',
      shadow: hasPhoto,
    });
    for (const [name, x] of [
      [str(d, 'thuis'), homeX],
      [str(d, 'uit'), awayX],
    ] as const) {
      text(ctx, name.toUpperCase(), x, nameY, {
        size: nameSize,
        family: theme.fonts.condensed,
        weight: 700,
        color: fg,
        align: 'center',
        maxWidth: W * 0.42,
        shadow: hasPhoto,
      });
    }

    footer(rc, hasPhoto ? 'rgba(255,255,255,0.8)' : undefined);
  },
};
