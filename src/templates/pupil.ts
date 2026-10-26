import { theme } from '../theme';
import {
  drawCover,
  fitWrapped,
  footer,
  formatDate,
  header,
  patternBackground,
  roundRect,
  setFont,
  text,
} from '../render/canvasUtils';
import { nextSaturday } from './dates';
import { img, str, type TemplateDef } from './types';

export const pupil: TemplateDef = {
  id: 'pupil',
  name: 'Pupil van de week',
  description: 'Zet de pupil in het zonnetje',
  emoji: '⭐',
  fields: [
    { key: 'foto', label: 'Foto pupil', type: 'image' },
    { key: 'naam', label: 'Naam pupil', type: 'text', placeholder: 'Voornaam Achternaam' },
    { key: 'team', label: 'Team', type: 'text', placeholder: 'JO9-1' },
    { key: 'wedstrijd', label: 'Wedstrijd', type: 'text', placeholder: 'VV Elspeet 1 - Tegenstander' },
    { key: 'datum', label: 'Datum', type: 'date' },
    { key: 'sponsor', label: 'Mogelijk gemaakt door (optioneel)', type: 'text', placeholder: 'Sponsor' },
  ],
  defaults: {
    foto: null,
    naam: 'Naam Pupil',
    team: 'JO9-1',
    wedstrijd: 'VV Elspeet 1 - Tegenstander',
    datum: nextSaturday(),
    sponsor: '',
  },
  draw(rc, d) {
    const { ctx, W, H, pal, design } = rc;
    const s = design.textScale;
    const pad = W * 0.07;
    patternBackground(rc);
    const headBottom = header(rc, 'Pupil van de week', formatDate(str(d, 'datum')), H * 0.045);

    const wide = H / W < 1.15;
    const top = headBottom + W * 0.06;
    const bottom = H - W * 0.11;

    // Fotovak + tekstvak
    let px: number, py: number, pw: number, ph: number, tx: number, ty: number, tw: number;
    if (wide) {
      px = pad;
      py = top;
      pw = W * 0.46;
      ph = bottom - top;
      tx = px + pw + W * 0.05;
      tw = W - pad - tx;
      ty = top;
    } else {
      const textBlock = W * 0.38;
      px = pad;
      py = top;
      pw = W - pad * 2;
      ph = bottom - top - textBlock;
      tx = pad;
      tw = W - pad * 2;
      ty = py + ph + W * 0.06;
    }

    const radius = W * 0.035;
    // Accentblok achter de foto
    ctx.save();
    roundRect(ctx, px + W * 0.02, py + W * 0.02, pw, ph, radius);
    ctx.fillStyle = pal.accent;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, px, py, pw, ph, radius);
    ctx.clip();
    const photo = rc.images.foto;
    ctx.fillStyle = pal.bg2;
    ctx.fillRect(px, py, pw, ph);
    // Subtiele banen achter een uitgeknipte of uitgezoomde foto
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = pal.fg;
    for (let x = px + pw / 9; x < px + pw; x += (pw / 9) * 2) ctx.fillRect(x, py, pw / 9, ph);
    ctx.globalAlpha = 1;
    if (photo) drawCover(ctx, photo, px, py, pw, ph, img(d, 'foto'));
    else {
      text(ctx, 'Upload een foto', px + pw / 2, py + ph / 2, {
        size: W * 0.04,
        color: pal.muted,
        align: 'center',
        baseline: 'middle',
      });
    }
    ctx.restore();

    // Tekst
    const name = fitWrapped(ctx, str(d, 'naam').toUpperCase(), tw, 2, {
      size: (wide ? W * 0.085 : W * 0.11) * s,
      family: theme.fonts.heading,
    });
    setFont(ctx, { size: name.size, family: theme.fonts.heading });
    ctx.fillStyle = pal.fg;
    let y = ty + name.size * 0.9;
    for (const line of name.lines) {
      ctx.textAlign = 'left';
      ctx.fillText(line, tx, y);
      y += name.size * 1.05;
    }
    y += W * 0.005;
    if (str(d, 'team')) {
      text(ctx, str(d, 'team').toUpperCase(), tx, y, {
        size: W * 0.046 * s,
        family: theme.fonts.condensed,
        weight: 700,
        color: pal.accent,
        maxWidth: tw,
        spacing: 2,
      });
      y += W * 0.06 * s;
    }
    if (str(d, 'wedstrijd')) {
      const m = fitWrapped(ctx, str(d, 'wedstrijd'), tw, wide ? 3 : 2, {
        size: W * 0.034 * s,
        weight: 600,
      });
      ctx.fillStyle = pal.fg;
      for (const line of m.lines) {
        ctx.fillText(line, tx, y);
        y += m.size * 1.3;
      }
    }
    if (str(d, 'sponsor')) {
      y += W * 0.01;
      text(ctx, `Mogelijk gemaakt door ${str(d, 'sponsor')}`, tx, y, {
        size: W * 0.028 * s,
        color: pal.muted,
        maxWidth: tw,
      });
    }

    footer(rc);
  },
};
