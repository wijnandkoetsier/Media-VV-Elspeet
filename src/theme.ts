/**
 * HUISSTIJL VV ELSPEET
 * --------------------
 * Dit zijn PLACEHOLDERS. Vervang de kleuren hieronder door de officiële clubkleuren
 * en zet het echte logo in `public/logo.svg` (of `public/logo.png` en pas `logoUrl` aan).
 */
export const theme = {
  clubName: 'VV Elspeet',
  /** Pad (relatief t.o.v. de app) naar het clublogo. */
  logoUrl: 'logo.png',
  /** Tekst onderaan elke afbeelding, leeg laten om te verbergen. */
  footer: '#vvelspeet',
  colors: {
    primary: '#161616', // clubkleur zwart (iets zachter dan puur zwart)
    primaryDark: '#050505',
    secondary: '#ffffff', // clubkleur wit
    accent: '#e0b32a', // goud als accent, zodat het niet alleen zwart-wit is
    accentDark: '#c39516',
    dark: '#111111',
    light: '#f5f5f3',
  },
  fonts: {
    heading: 'Anton',
    condensed: 'Oswald',
    body: 'Inter',
  },
};

export type Variant = 'primary' | 'secondary' | 'gold';

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
    // Wit: lichte achtergrond, zwarte kaarten, goud in de details
    case 'secondary':
      return {
        bg: c.light,
        bg2: '#e1e1dc',
        fg: c.dark,
        accent: c.dark,
        accentOnPhoto: c.accent,
        accentFg: '#ffffff',
        muted: 'rgba(17,17,17,0.68)',
        card: c.dark,
        cardFg: '#ffffff',
      };
    // Goud: opvallende variant voor bijv. uitslagen of sponsors
    case 'gold':
      return {
        bg: c.accent,
        bg2: c.accentDark,
        fg: c.dark,
        accent: c.dark,
        accentOnPhoto: c.accent,
        accentFg: c.accent,
        muted: 'rgba(17,17,17,0.72)',
        card: 'rgba(17,17,17,0.88)',
        cardFg: '#ffffff',
      };
    // Zwart: standaard clubstijl
    default:
      return {
        bg: '#1f1f1f',
        bg2: c.primaryDark,
        fg: '#ffffff',
        accent: c.accent,
        accentOnPhoto: c.accent,
        accentFg: c.dark,
        muted: 'rgba(255,255,255,0.75)',
        card: 'rgba(255,255,255,0.09)',
        cardFg: '#ffffff',
      };
  }
}
