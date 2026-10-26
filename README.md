# Media VV Elspeet

Mobiele web-app (PWA) waarmee je snel social media afbeeldingen maakt voor VV Elspeet.
Kies een template, vul de gegevens in, upload foto's, pas het ontwerp aan en exporteer als PNG.

## Templates

| Template | Aanpasbaar |
| --- | --- |
| **Matchday** | thuis/uit, datum, aftrap, locatie, competitie, achtergrondfoto, logo's beide teams |
| **Pupil van de week** | foto, naam, team, wedstrijd, datum, sponsor |
| **Uitslagen** | lijst met wedstrijden + scores, datum, achtergrondfoto |
| **Programma** | lijst met tijd, thuis, uit, extra info (veld), datum |
| **Sponsoring** | label, titel, sponsorlogo, naam, tekst, website, achtergrondfoto |
| **Nieuws** | foto, label, kop, intro |
| **Agenda** | lijst met datum, activiteit, tijd, locatie |

Elk template heeft een tab **Ontwerp** met:
- formaat: Post 4:5 (1080×1350), Vierkant (1080×1080), Story 9:16 (1080×1920)
- kleurstijl: Club / Licht / Donker
- donkere laag over foto's, tekstgrootte, clublogo aan/uit

Bij foto's kun je inzoomen en de uitsnede verschuiven.
Ingevulde gegevens worden automatisch op het toestel bewaard per template (knop **Reset** wist ze).

**Exporteren:** op de telefoon opent *Delen / opslaan* het deelmenu (Opslaan in Foto's, Instagram, WhatsApp…).
*Download PNG* slaat het bestand direct op.

## Huisstijl aanpassen

De kleuren en het logo zijn nu **placeholders**:

- **Logo:** vervang `public/logo.svg` door het echte clublogo
  (een PNG kan ook: zet het in `public/logo.png` en wijzig `logoUrl` in `src/theme.ts`).
- **Kleuren:** pas `colors` aan in `src/theme.ts`. Werk ook `--primary`/`--accent` in `src/styles.css`
  en `theme_color` in `vite.config.ts` bij voor de app zelf.
- **App-iconen:** vervang `public/icons/icon-192.png` en `icon-512.png`.
- **Hashtag onderaan:** `footer` in `src/theme.ts` (leeg = verbergen).

## Ontwikkelen

```bash
npm install
npm run dev       # start lokaal, ook bereikbaar via je telefoon op hetzelfde wifi
npm run build     # typecheck + productie-build in dist/
npm run preview   # bekijk de build
```

## Online zetten (GitHub Pages)

De workflow `.github/workflows/deploy.yml` bouwt en publiceert de app bij elke push naar `main`.
Eenmalig instellen: **Settings → Pages → Source: GitHub Actions**.
Open daarna de URL op je telefoon en kies *Zet op beginscherm* om de app te installeren.

## Techniek

Vite + React + TypeScript. Afbeeldingen worden getekend op een `<canvas>` op de exacte exportresolutie;
elk template is één bestand in `src/templates/` met zijn velden en een `draw`-functie.
Een nieuw template toevoegen = een bestand maken en het opnemen in `src/templates/index.ts`.
