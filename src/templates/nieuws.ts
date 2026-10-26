import { theme } from '../theme';
import {
  drawClubLogo,
  drawCover,
  fillRound,
  fitWrapped,
  footer,
  patternBackground,
  setFont,
  text,
} from '../render/canvasUtils';
import { img, str, type TemplateDef } from './types';

export const nieuws: TemplateDef = {
  id: 'nieuws',
  name: 'Nieuws',
  description: 'Nieuwsbericht met foto en kop',
  emoji: '📰',
  fields: [
    { key: 'foto', label: 'Foto', type: 'image' },
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Nieuws' },
    { key: 'kop', label: 'Kop', type: 'textarea', placeholder: 'Pakkende kop' },
    { key: 'intro', label: 'Intro (optioneel)', type: 'textarea', placeholder: 'Korte toelichting' },
  ],
  defaults: {
    foto: null,
    label: 'Nieuws',
    kop: 'Hier komt de kop van het nieuwsbericht',
    intro: 'Een korte introductie van het bericht. Lees meer op de website.',
  },
  draw(rc, d) {
    const { ctx, W, H, pal, design } = rc;
    const s = design.textScale;
    const pad = W * 0.07;
    patternBackground(rc);

    const textArea = Math.max(W * 0.5, H * 0.42);
    const photoH = H - textArea;
    const slant = W * 0.07;

    // Foto met schuine onderrand
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, photoH - slant);
    ctx.lineTo(0, photoH);
    ctx.closePath();
    ctx.clip();
    const photo = rc.images.foto;
    if (photo) {
      drawCover(ctx, photo, 0, 0, W, photoH, img(d, 'foto'));
      const g = ctx.createLinearGradient(0, 0, 0, photoH * 0.4);
      g.addColorStop(0, `rgba(0,0,0,${design.overlay * 0.6})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, photoH);
    } else {
      ctx.fillStyle = pal.bg2;
      ctx.fillRect(0, 0, W, photoH);
      text(ctx, 'Upload een foto', W / 2, photoH / 2, {
        size: W * 0.04,
        color: pal.muted,
        align: 'center',
        baseline: 'middle',
      });
    }
    ctx.restore();

    // Accentlijn langs de schuine rand
    ctx.save();
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = W * 0.012;
    ctx.beginPath();
    ctx.moveTo(0, photoH);
    ctx.lineTo(W, photoH - slant);
    ctx.stroke();
    ctx.restore();

    drawClubLogo(rc, pad, H * 0.035, W * 0.13);

    // Label
    let y = photoH - slant * 0.2;
    if (str(d, 'label')) {
      const label = str(d, 'label').toUpperCase();
      setFont(ctx, { size: W * 0.034, family: theme.fonts.condensed, weight: 700 });
      const lw = ctx.measureText(label).width + W * 0.06;
      const lh = W * 0.065;
      fillRound(ctx, pad, y - lh / 2, lw, lh, W * 0.01, pal.accent);
      text(ctx, label, pad + lw / 2, y + lh * 0.04, {
        size: W * 0.034,
        family: theme.fonts.condensed,
        weight: 700,
        color: pal.accentFg,
        align: 'center',
        baseline: 'middle',
        spacing: 3,
      });
    }
    y += W * 0.08;

    const bottom = H - W * 0.11;
    const hasIntro = !!str(d, 'intro').trim();
    const head = fitWrapped(ctx, str(d, 'kop').toUpperCase(), W - pad * 2, hasIntro ? 3 : 4, {
      size: W * 0.085 * s,
      family: theme.fonts.heading,
    });
    setFont(ctx, { size: head.size, family: theme.fonts.heading });
    ctx.fillStyle = pal.fg;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (const line of head.lines) {
      ctx.fillText(line, pad, y);
      y += head.size * 1.08;
    }

    if (hasIntro) {
      y += W * 0.02;
      const lineH = 1.4;
      const maxLines = Math.max(1, Math.floor((bottom - y) / (W * 0.034 * s * lineH)));
      const intro = fitWrapped(ctx, str(d, 'intro'), W - pad * 2, Math.min(maxLines, 5), { size: W * 0.034 * s }, 18);
      setFont(ctx, { size: intro.size });
      ctx.fillStyle = pal.muted;
      for (const line of intro.lines) {
        if (y + intro.size > bottom) break;
        ctx.fillText(line, pad, y);
        y += intro.size * lineH;
      }
    }

    footer(rc);
  },
};
