import { theme } from '../theme';
import {
  background,
  drawCover,
  drawFit,
  fitWrapped,
  footer,
  header,
  roundRect,
  setFont,
  text,
} from '../render/canvasUtils';
import { img, str, type RenderContext, type SlideItem, type TemplateData, type TemplateDef } from './types';

const sponsorFields = [
  {
    key: 'logoSponsor',
    label: 'Logo of afbeelding sponsor',
    type: 'image' as const,
    alpha: true,
    adjustable: true,
    hint: 'Logo met transparantie past in het vak; een foto vult het vak',
  },
  { key: 'naam', label: 'Naam sponsor', type: 'text' as const, placeholder: 'Bedrijfsnaam' },
  { key: 'tekst', label: 'Tekst', type: 'textarea' as const, placeholder: 'Bedankt voor de steun…' },
  { key: 'website', label: 'Website', type: 'text' as const, placeholder: 'www.sponsor.nl' },
];

const newSponsor = (): SlideItem => ({
  logoSponsor: null,
  naam: 'Naam Sponsor',
  tekst: 'Bedankt voor de steun aan VV Elspeet. Samen maken we het verschil!',
  website: 'www.sponsor.nl',
});

export const sponsoring: TemplateDef = {
  id: 'sponsoring',
  name: 'Sponsoring',
  description: 'Bedank één of meer sponsors (carrousel)',
  emoji: '🤝',
  fields: [
    { key: 'titel', label: 'Titel', type: 'text', placeholder: 'Bedankt!' },
    { key: 'label', label: 'Subtitel', type: 'text', placeholder: 'Sponsor' },
    { key: 'foto', label: 'Achtergrondfoto (optioneel, voor alle dia’s)', type: 'image' },
  ],
  slides: { key: 'sponsors', label: 'Sponsor', fields: sponsorFields, max: 10, create: newSponsor },
  defaults: {
    titel: 'Bedankt!',
    label: 'Sponsor',
    foto: null,
    sponsors: [newSponsor()],
  },
  // Concepten van vóór de carrousel hadden één sponsor als losse velden.
  migrate(d: TemplateData): TemplateData {
    if (Array.isArray(d.sponsors)) return d;
    const { logoSponsor = null, naam = '', tekst = '', website = '', ...rest } = d;
    return { ...rest, sponsors: [{ logoSponsor, naam, tekst, website } as SlideItem] };
  },
  draw(rc, d) {
    const { ctx, W, H, pal, design } = rc;
    const s = design.textScale;
    const pad = W * 0.08;
    const hasPhoto = background(rc, 'foto', img(d, 'foto'), 'even');
    const fg = hasPhoto ? '#ffffff' : pal.fg;
    const nameColor = hasPhoto ? pal.accentOnPhoto : pal.accent;
    const webColor = hasPhoto ? 'rgba(255,255,255,0.85)' : pal.muted;

    // Kop: clublogo met titel en subtitel ernaast
    const top = header(rc, str(d, 'titel') || 'Bedankt!', str(d, 'label'), H * 0.045, hasPhoto) + W * 0.05;
    const bottom = H - W * 0.1;

    // Vierkant formaat: vak links, tekst rechts, zodat het vak groot kan zijn.
    if (H / W < 1.15) {
      const size = Math.min(bottom - top, W * 0.56);
      const bx = W * 0.06;
      drawBox(rc, d, bx, top + (bottom - top - size) / 2, size);

      const tx = bx + size + W * 0.05;
      const tw = W - tx - W * 0.06;
      const name = fitWrapped(ctx, str(d, 'naam').toUpperCase(), tw, 3, {
        size: W * 0.065 * s,
        family: theme.fonts.heading,
      });
      const msg = fitWrapped(ctx, str(d, 'tekst'), tw, 7, { size: W * 0.032 * s }, 16);
      const gap = W * 0.025;
      const nameH = str(d, 'naam') ? name.lines.length * name.size * 1.05 : 0;
      const msgH = str(d, 'tekst') ? msg.lines.length * msg.size * 1.35 : 0;
      const webH = str(d, 'website') ? W * 0.04 : 0;
      const blockH = nameH + msgH + webH + gap * 2;
      let y = top + Math.max(0, (bottom - top - blockH) / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      if (nameH) {
        setFont(ctx, { size: name.size, family: theme.fonts.heading });
        ctx.fillStyle = nameColor;
        for (const line of name.lines) {
          ctx.fillText(line, tx, y);
          y += name.size * 1.05;
        }
        y += gap;
      }
      if (msgH) {
        setFont(ctx, { size: msg.size });
        ctx.fillStyle = fg;
        for (const line of msg.lines) {
          ctx.fillText(line, tx, y);
          y += msg.size * 1.35;
        }
        y += gap;
      }
      if (webH) {
        text(ctx, str(d, 'website'), tx, y, {
          size: W * 0.03,
          family: theme.fonts.condensed,
          weight: 600,
          color: webColor,
          baseline: 'top',
          spacing: 1,
          maxWidth: tw,
        });
      }
      footer(rc, hasPhoto ? 'rgba(255,255,255,0.8)' : undefined);
      return;
    }

    // Post en story: vak gecentreerd met tekst eronder
    const cx = W / 2;
    const tall = H / W > 1.5;
    const msg = fitWrapped(ctx, str(d, 'tekst'), W - pad * 2.2, tall ? 4 : 3, { size: W * 0.036 * s }, 18);
    const msgH = str(d, 'tekst') ? msg.lines.length * msg.size * 1.35 : 0;
    const nameH = str(d, 'naam') ? W * 0.075 * s : 0;
    const webH = str(d, 'website') ? W * 0.045 : 0;
    const gap = W * 0.035;
    const textBlock = nameH + msgH + webH + gap * ([nameH, msgH, webH].filter(Boolean).length + 0.5);

    // Vierkant vak: zo groot als past (story mag bijna de volle breedte gebruiken)
    const size = Math.max(W * 0.3, Math.min(W * (tall ? 0.86 : 0.68), bottom - top - textBlock));
    const used = size + textBlock;
    let y = top + Math.max(0, (bottom - top - used) / 2);
    drawBox(rc, d, cx - size / 2, y, size);
    y += size + gap;

    if (nameH) {
      text(ctx, str(d, 'naam').toUpperCase(), cx, y, {
        size: W * 0.065 * s,
        family: theme.fonts.heading,
        color: nameColor,
        align: 'center',
        baseline: 'top',
        maxWidth: W - pad * 2,
      });
      y += nameH + gap * 0.4;
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
      y += gap * 0.4;
    }
    if (webH) {
      text(ctx, str(d, 'website'), cx, y, {
        size: W * 0.034,
        family: theme.fonts.condensed,
        weight: 600,
        color: webColor,
        align: 'center',
        baseline: 'top',
        spacing: 2,
        maxWidth: W - pad * 2,
      });
    }

    footer(rc, hasPhoto ? 'rgba(255,255,255,0.8)' : undefined);
  },
};

/** Wit vierkant vak met het sponsorlogo of de foto. */
function drawBox(rc: RenderContext, d: TemplateData, bx: number, y: number, size: number) {
  const { ctx, W } = rc;
  const radius = W * 0.03;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = W * 0.03;
  roundRect(ctx, bx, y, size, size, radius);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  const logo = rc.images.logoSponsor;
  const iv = img(d, 'logoSponsor');
  if (logo && iv) {
    ctx.save();
    roundRect(ctx, bx, y, size, size, radius);
    ctx.clip();
    // Passend (logo's, met marge) of vullend (foto's); automatisch op basis van transparantie
    const fit = iv.fit ?? (iv.src.startsWith('data:image/png') ? 'contain' : 'cover');
    if (fit === 'contain') {
      const m = size * 0.08;
      drawFit(ctx, logo, bx + m, y + m, size - m * 2, size - m * 2, iv);
    } else drawCover(ctx, logo, bx, y, size, size, iv);
    ctx.restore();
  } else {
    text(ctx, 'Upload het sponsorlogo', bx + size / 2, y + size / 2, {
      size: W * 0.032,
      color: '#8a958e',
      align: 'center',
      baseline: 'middle',
      maxWidth: size * 0.9,
    });
  }
}
