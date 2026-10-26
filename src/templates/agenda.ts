import { theme } from '../theme';
import { background, fillRound, footer, header, text } from '../render/canvasUtils';
import { inDays } from './dates';
import { cardColor, emptyHint, rows } from './listLayout';
import { img, list, str, type TemplateDef } from './types';

const monthFmt = new Intl.DateTimeFormat('nl-NL', { month: 'short' });

function dateParts(iso: string): { day: string; month: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return { day: iso.slice(0, 3), month: '' };
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return { day: String(d.getDate()), month: monthFmt.format(d).replace('.', '').toUpperCase() };
}

export const agenda: TemplateDef = {
  id: 'agenda',
  name: 'Agenda',
  description: 'Activiteiten en evenementen',
  emoji: '🗓️',
  fields: [
    { key: 'titel', label: 'Titel', type: 'text', placeholder: 'Agenda' },
    { key: 'subtitel', label: 'Subtitel', type: 'text', placeholder: 'Wat staat er op de planning' },
    {
      key: 'items',
      label: 'Activiteiten',
      type: 'list',
      itemLabel: 'Activiteit',
      max: 10,
      columns: [
        { key: 'datum', label: 'Datum', type: 'date', width: 3 },
        { key: 'titel', label: 'Activiteit', placeholder: 'Activiteit', width: 4 },
        { key: 'tijd', label: 'Tijd', type: 'time', width: 2 },
        { key: 'locatie', label: 'Locatie', placeholder: 'Kantine', width: 3 },
      ],
    },
    { key: 'foto', label: 'Achtergrondfoto (optioneel)', type: 'image' },
  ],
  defaults: {
    titel: 'Agenda',
    subtitel: 'Binnenkort bij VV Elspeet',
    items: [
      { datum: inDays(5), titel: 'Ledenvergadering', tijd: '20:00', locatie: 'Kantine' },
      { datum: inDays(12), titel: 'Jeugdtoernooi', tijd: '09:00', locatie: 'Sportpark' },
      { datum: inDays(20), titel: 'Klaverjasavond', tijd: '19:30', locatie: 'Kantine' },
    ],
    foto: null,
  },
  draw(rc, d) {
    const { ctx, W, H, pal, design } = rc;
    const s = design.textScale;
    const pad = W * 0.07;
    const hasPhoto = background(rc, 'foto', img(d, 'foto'), 'even');
    const headBottom = header(rc, str(d, 'titel') || 'Agenda', str(d, 'subtitel'), H * 0.045, hasPhoto);

    const items = list(d, 'items');
    const top = headBottom + W * 0.07;
    const bottom = H - W * 0.11;
    if (!items.length) emptyHint(rc, 'Voeg activiteiten toe', (top + bottom) / 2);
    const L = rows(rc, items.length, top, bottom);
    const card = cardColor(rc, hasPhoto);

    items.forEach((it, i) => {
      const y = L.y(i);
      const h = L.rowH;
      fillRound(ctx, pad, y, W - pad * 2, h, h * 0.18, card);
      const bw = h * 1.15;
      fillRound(ctx, pad, y, bw, h, h * 0.18, pal.accent);
      const { day, month } = dateParts(it.datum || '');
      text(ctx, day, pad + bw / 2, y + h * 0.55, {
        size: h * 0.48,
        family: theme.fonts.heading,
        color: pal.accentFg,
        align: 'center',
        maxWidth: bw * 0.85,
      });
      text(ctx, month, pad + bw / 2, y + h * 0.84, {
        size: h * 0.2,
        family: theme.fonts.condensed,
        weight: 700,
        color: pal.accentFg,
        align: 'center',
        spacing: 2,
        maxWidth: bw * 0.85,
      });
      const tx = pad + bw + h * 0.3;
      const maxW = W - pad - tx - h * 0.25;
      const meta = [it.tijd, it.locatie].filter((x) => x?.trim()).join('  ·  ');
      text(ctx, (it.titel || '').toUpperCase(), tx, y + h * (meta ? 0.44 : 0.53), {
        size: h * 0.32 * s,
        family: theme.fonts.condensed,
        weight: 700,
        color: pal.cardFg,
        baseline: 'middle',
        maxWidth: maxW,
        minSize: 10,
      });
      if (meta) {
        text(ctx, meta, tx, y + h * 0.76, {
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
