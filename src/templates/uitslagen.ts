import { theme } from '../theme';
import { background, fillRound, footer, formatDate, header, text } from '../render/canvasUtils';
import { lastSaturday } from './dates';
import { cardColor, emptyHint, rows } from './listLayout';
import { img, list, str, type TemplateDef } from './types';

export const uitslagen: TemplateDef = {
  id: 'uitslagen',
  name: 'Uitslagen',
  description: 'Alle uitslagen van het weekend',
  emoji: '📊',
  fields: [
    { key: 'titel', label: 'Titel', type: 'text', placeholder: 'Uitslagen' },
    { key: 'datum', label: 'Datum', type: 'date' },
    {
      key: 'wedstrijden',
      label: 'Wedstrijden',
      type: 'list',
      itemLabel: 'Wedstrijd',
      max: 12,
      columns: [
        { key: 'thuis', label: 'Thuis', placeholder: 'VV Elspeet 1', width: 3 },
        { key: 'uit', label: 'Uit', placeholder: 'Tegenstander', width: 3 },
        { key: 'st', label: 'Goals thuis', type: 'number', placeholder: '0', width: 1 },
        { key: 'su', label: 'Goals uit', type: 'number', placeholder: '0', width: 1 },
      ],
    },
    { key: 'foto', label: 'Achtergrondfoto (optioneel)', type: 'image' },
  ],
  defaults: {
    titel: 'Uitslagen',
    datum: lastSaturday(),
    wedstrijden: [
      { thuis: 'VV Elspeet 1', st: '2', su: '1', uit: 'Tegenstander' },
      { thuis: 'Tegenstander', st: '0', su: '3', uit: 'VV Elspeet 2' },
      { thuis: 'VV Elspeet JO19-1', st: '4', su: '4', uit: 'Tegenstander' },
    ],
    foto: null,
  },
  draw(rc, d) {
    const { ctx, W, H, pal, design } = rc;
    const s = design.textScale;
    const pad = W * 0.07;
    const hasPhoto = background(rc, 'foto', img(d, 'foto'), 'even');
    const headBottom = header(rc, str(d, 'titel') || 'Uitslagen', formatDate(str(d, 'datum')), H * 0.045, hasPhoto);

    const items = list(d, 'wedstrijden');
    const top = headBottom + W * 0.07;
    const bottom = H - W * 0.11;
    if (!items.length) emptyHint(rc, 'Voeg wedstrijden toe', (top + bottom) / 2);
    const L = rows(rc, items.length, top, bottom);
    const card = cardColor(rc, hasPhoto);

    items.forEach((m, i) => {
      const y = L.y(i);
      const h = L.rowH;
      fillRound(ctx, pad, y, W - pad * 2, h, h * 0.18, card);
      const boxW = h * 1.75;
      const bx = W / 2 - boxW / 2;
      fillRound(ctx, bx, y + h * 0.14, boxW, h * 0.72, h * 0.14, pal.accent);
      const score = `${m.st || '-'}  -  ${m.su || '-'}`;
      text(ctx, score, W / 2, y + h * 0.53, {
        size: h * 0.46,
        family: theme.fonts.heading,
        color: pal.accentFg,
        align: 'center',
        baseline: 'middle',
        maxWidth: boxW * 0.88,
      });
      const nameW = bx - pad - h * 0.45;
      const nameOpts = (name: string) => ({
        size: h * 0.3 * s,
        family: theme.fonts.condensed,
        weight: /elspeet/i.test(name) ? 700 : 500,
        color: pal.cardFg,
        baseline: 'middle' as const,
        maxWidth: nameW,
        minSize: 10,
      });
      text(ctx, (m.thuis || '').toUpperCase(), bx - h * 0.25, y + h * 0.53, { ...nameOpts(m.thuis || ''), align: 'right' });
      text(ctx, (m.uit || '').toUpperCase(), bx + boxW + h * 0.25, y + h * 0.53, { ...nameOpts(m.uit || ''), align: 'left' });
    });

    footer(rc, hasPhoto ? 'rgba(255,255,255,0.8)' : undefined);
  },
};
