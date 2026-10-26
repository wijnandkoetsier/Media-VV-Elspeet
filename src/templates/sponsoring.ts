import { theme } from '../theme';
import {
  background,
  drawClubLogo,
  drawContain,
  fillRound,
  fitWrapped,
  footer,
  setFont,
  text,
} from '../render/canvasUtils';
import { img, str, type TemplateDef } from './types';

export const sponsoring: TemplateDef = {
  id: 'sponsoring',
  name: 'Sponsoring',
  description: 'Bedank of presenteer een sponsor',
  emoji: '🤝',
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Nieuwe sponsor' },
    { key: 'titel', label: 'Titel', type: 'text', placeholder: 'Welkom!' },
    { key: 'logoSponsor', label: 'Logo sponsor', type: 'image', alpha: true },
    { key: 'naam', label: 'Naam sponsor', type: 'text', placeholder: 'Bedrijfsnaam' },
    { key: 'tekst', label: 'Tekst', type: 'textarea', placeholder: 'Bedankt voor de steun…' },
    { key: 'website', label: 'Website', type: 'text', placeholder: 'www.sponsor.nl' },
    { key: 'foto', label: 'Achtergrondfoto (optioneel)', type: 'image' },
  ],
  defaults: {
    label: 'Sponsor',
    titel: 'Bedankt!',
    logoSponsor: null,
    naam: 'Naam Sponsor',
    tekst: 'Bedankt voor de steun aan VV Elspeet. Samen maken we het verschil!',
    website: 'www.sponsor.nl',
    foto: null,
  },
  draw(rc, d) {
    const { ctx, W, H, pal, design } = rc;
    const s = design.textScale;
    const pad = W * 0.08;
    const hasPhoto = background(rc, 'foto', img(d, 'foto'), 'even');
    const fg = hasPhoto ? '#ffffff' : pal.fg;
    const cx = W / 2;

    // Kop: logo + label
    const logoSize = W * 0.12;
    let top = H * 0.045;
    if (rc.logo && design.showLogo) {
      drawClubLogo(rc, cx - logoSize / 2, top, logoSize);
      top += logoSize + W * 0.02;
    }
    if (str(d, 'label')) {
      const label = str(d, 'label').toUpperCase();
      setFont(ctx, { size: W * 0.03, family: theme.fonts.condensed, weight: 700 });
      const lw = ctx.measureText(label).width + W * 0.07;
      const lh = W * 0.058;
      fillRound(ctx, cx - lw / 2, top, lw, lh, lh / 2, pal.accent);
      text(ctx, label, cx, top + lh * 0.54, {
        size: W * 0.03,
        family: theme.fonts.condensed,
        weight: 700,
        color: pal.accentFg,
        align: 'center',
        baseline: 'middle',
        spacing: 3,
      });
      top += lh;
    }
    const bottom = H - W * 0.1;

    // Blokken meten
    const title = fitWrapped(ctx, str(d, 'titel').toUpperCase(), W - pad * 2, 2, {
      size: W * 0.12 * s,
      family: theme.fonts.heading,
    });
    const titleH = str(d, 'titel') ? title.lines.length * title.size * 1.02 : 0;
    const msg = fitWrapped(ctx, str(d, 'tekst'), W - pad * 2.4, 4, { size: W * 0.036 * s }, 18);
    const msgH = str(d, 'tekst') ? msg.lines.length * msg.size * 1.35 : 0;
    const nameH = str(d, 'naam') ? W * 0.075 * s : 0;
    const webH = str(d, 'website') ? W * 0.05 : 0;
    const fixed = titleH + msgH + nameH + webH;
    const gaps = 5;
    const minGap = W * 0.03;
    const cardW = W * 0.72;
    const cardH = Math.max(W * 0.18, Math.min(W * 0.42, bottom - top - fixed - minGap * gaps));
    const gap = Math.max(minGap, Math.min(W * 0.07, (bottom - top - fixed - cardH) / gaps));
    // Tussenruimtes: titel→kaart, kaart→naam, en 2× een halve (naam→tekst→website).
    const used = fixed + cardH + gap * 3;
    let y = top + Math.max(gap * 0.6, (bottom - top - used) / 2);

    // Titel
    if (titleH) {
      setFont(ctx, { size: title.size, family: theme.fonts.heading });
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const line of title.lines) {
        ctx.fillText(line, cx, y);
        y += title.size * 1.02;
      }
      y += gap;
    }

    // Logo-kaart
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = W * 0.03;
    fillRound(ctx, cx - cardW / 2, y, cardW, cardH, W * 0.03, '#ffffff');
    ctx.restore();
    const logo = rc.images.logoSponsor;
    if (logo) drawContain(ctx, logo, cx - cardW / 2 + cardW * 0.1, y + cardH * 0.12, cardW * 0.8, cardH * 0.76);
    else
      text(ctx, 'Upload het sponsorlogo', cx, y + cardH / 2, {
        size: W * 0.034,
        color: '#8a958e',
        align: 'center',
        baseline: 'middle',
      });
    y += cardH + gap;

    if (nameH) {
      text(ctx, str(d, 'naam').toUpperCase(), cx, y, {
        size: W * 0.065 * s,
        family: theme.fonts.heading,
        color: hasPhoto ? pal.accentOnPhoto : pal.accent,
        align: 'center',
        baseline: 'top',
        maxWidth: W - pad * 2,
      });
      y += nameH + gap * 0.5;
    }
    if (msgH) {
      setFont(ctx, { size: msg.size });
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const line of msg.lines) {
        ctx.fillText(line, cx, y);
        y += msg.size * 1.35;
      }
      y += gap * 0.5;
    }
    if (webH) {
      text(ctx, str(d, 'website'), cx, y, {
        size: W * 0.034,
        family: theme.fonts.condensed,
        weight: 600,
        color: hasPhoto ? 'rgba(255,255,255,0.85)' : pal.muted,
        align: 'center',
        baseline: 'top',
        spacing: 2,
        maxWidth: W - pad * 2,
      });
    }

    footer(rc, hasPhoto ? 'rgba(255,255,255,0.8)' : undefined);
  },
};
