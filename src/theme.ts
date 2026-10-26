/**
 * HUISSTIJL VV ELSPEET
 * --------------------
 * Dit zijn PLACEHOLDERS. Vervang de kleuren hieronder door de officiële clubkleuren
 * en zet het echte logo in `public/logo.svg` (of `public/logo.png` en pas `logoUrl` aan).
 */
export const theme = {
  clubName: 'VV Elspeet',
  /** Pad (relatief t.o.v. de app) naar het clublogo. */
  logoUrl: 'logo.svg',
  /** Tekst onderaan elke afbeelding, leeg laten om te verbergen. */
  footer: '#vvelspeet',
  colors: {
    primary: '#0b5d2e', // TODO: hoofdkleur club
    primaryDark: '#063a1c',
    secondary: '#ffffff', // TODO: tweede clubkleur
    accent: '#f5c400', // TODO: accentkleur
    dark: '#0f1512',
    light: '#f4f6f4',
  },
  fonts: {
    heading: 'Anton',
    condensed: 'Oswald',
    body: 'Inter',
  },
};

export type Variant = 'primary' | 'secondary' | 'dark';

export interface Palette {
  bg: string;
  bg2: string;
  fg: string;
  accent: string;
  /** Accentkleur voor tekst bovenop een (donkere) foto. */
  accentOnPhoto: string;
  /** Tekstkleur bovenop de accentkleur. */
  accentFg: string;
  muted: string;
  /** Kleur voor kaarten/rijen bovenop de achtergrond. */
  card: string;
  cardFg: string;
}

export function palette(variant: Variant): Palette {
  const c = theme.colors;
  switch (variant) {
    case 'secondary':
      return {
        bg: c.light,
        bg2: '#dfe6e1',
        fg: c.primaryDark,
        accent: c.primary,
        accentOnPhoto: '#ffffff',
        accentFg: '#ffffff',
        muted: 'rgba(6,58,28,0.7)',
        card: c.primary,
        cardFg: '#ffffff',
      };
    case 'dark':
      return {
        bg: c.dark,
        bg2: '#1c2620',
        fg: '#ffffff',
        accent: c.accent,
        accentOnPhoto: c.accent,
        accentFg: c.dark,
        muted: 'rgba(255,255,255,0.72)',
        card: 'rgba(255,255,255,0.08)',
        cardFg: '#ffffff',
      };
    default:
      return {
        bg: c.primary,
        bg2: c.primaryDark,
        fg: '#ffffff',
        accent: c.accent,
        accentOnPhoto: c.accent,
        accentFg: c.dark,
        muted: 'rgba(255,255,255,0.78)',
        card: 'rgba(0,0,0,0.28)',
        cardFg: '#ffffff',
      };
  }
}
