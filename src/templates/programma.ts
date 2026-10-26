import { theme } from '../theme';
import { background, fillRound, footer, formatDate, header, text } from '../render/canvasUtils';
import { nextSaturday } from './dates';
import { cardColor, emptyHint, rows } from './listLayout';
import { img, list, str, type TemplateDef } from './types';

export const programma: TemplateDef = {
  id: 'programma',
  name: 'Programma',
  description: 'Het wedstrijdprogramma',
  emoji: '📅',
  fields: [
    { key: 'titel', label: 'Titel', type: 'text', placeholder: 'Programma' },
    { key: 'datum', label: 'Datum', type: 'date' },
    {
      key: 'wedstrijden',
      label: 'Wedstrijden',
      type: 'list',
      itemLabel: 'Wedstrijd',
      max: 12,
      columns: [
        { key: 'tijd', label: 'Tijd', type: 'time', width: 2 },
        { key: 'thuis', label: 'Thuis', placeholder: 'VV Elspeet 1', width: 3 },
        { key: 'uit', label: 'Uit', placeholder: 'Tegenstander', width: 3 },
        { key: 'info', label: 'Info', placeholder: 'Veld 1 (optioneel)', width: 3 },
      ],
    },
    { key: 'foto', label: 'Achtergrondfoto (optioneel)', type: 'image' },
  ],
  defaults: {
    titel: 'Programma',
    datum: nextSaturday(),
    wedstrijden: [
      { tijd: '09:00', thuis: 'VV Elspeet JO9-1', uit: 'Tegenstander', info: 'Veld 2' },
      { tijd: '12:00', thuis: 'Tegenstander', uit: 'VV Elspeet JO17-1', info: '' },
      { tijd: '14:30', thuis: 'VV Elspeet 1', uit: 'Tegenstander', info: 'Hoofdveld' },
    ],
    foto: null,
  },
  draw(rc, d) {
    const { ctx, W, H, pal, design } = rc;
    const s = design.textScale;
    const pad = W * 0.07;
    const hasPhoto = background(rc, 'foto', img(d, 'foto'), 'even');
    const headBottom = header(rc, str(d, 'titel') || 'Programma', formatDate(str(d, 'datum')), H * 0.045, hasPhoto);

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
      const tw = h * 1.65;
      fillRound(ctx, pad, y, tw, h, h * 0.18, pal.accent);
      text(ctx, m.tijd || '--:--', pad + tw / 2, y + h * 0.53, {
        size: h * 0.44,
        family: theme.fonts.heading,
        color: pal.accentFg,
        align: 'center',
        baseline: 'middle',
        maxWidth: tw * 0.85,
      });
      const tx = pad + tw + h * 0.3;
      const maxW = W - pad - tx - h * 0.25;
      const match = `${m.thuis || ''}  –  ${m.uit || ''}`.toUpperCase();
      const hasInfo = !!m.info?.trim();
      text(ctx, match, tx, y + h * (hasInfo ? 0.44 : 0.53), {
        size: h * 0.3 * s,
        family: theme.fonts.condensed,
        weight: 600,
        color: pal.cardFg,
        baseline: 'middle',
        maxWidth: maxW,
        minSize: 10,
      });
      if (hasInfo) {
        text(ctx, m.info, tx, y + h * 0.76, {
          size: h * 0.2 * s,
          weight: 500,
          color: pal.cardFg,
          baseline: 'middle',
          maxWidth: maxW,
          minSize: 9,
        });
      }
    });

    footer(rc, hasPhoto ? 'rgba(255,255,255,0.8)' : undefined);
  },
};
