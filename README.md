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
- kleurstijl: Zwart / Wit / Goud
- donkere laag over foto's, tekstgrootte, clublogo aan/uit

Bij foto's kun je in- en uitzoomen (0,3× tot 3×) en de uitsnede verschuiven.
Met **Achtergrond verwijderen** wordt de achtergrond rond personen weggehaald (werkt op het toestel zelf
met MediaPipe; het model van ±16 MB wordt de eerste keer gedownload en daarna bewaard).
Met **Achtergrond terugzetten** krijg je de originele foto terug.
**Galerij:** elke geüploade afbeelding (en elke foto waarvan de achtergrond is verwijderd) wordt automatisch
bewaard in de galerij op het toestel. Bij elk afbeeldingsveld kies je via **🖼️ Galerij** snel een eerdere afbeelding;
bij logo-velden staan transparante afbeeldingen meteen bovenaan. Via **Galerij** op het startscherm kun je meerdere
afbeeldingen tegelijk toevoegen (bijv. logo's van tegenstanders), zoeken op naam, hernoemen en verwijderen.
Dubbele uploads worden herkend en niet twee keer opgeslagen.

Ingevulde gegevens worden automatisch op het toestel bewaard per template (knop **Reset** wist ze).

**Schermindeling:** met de greep tussen voorbeeld en invoer wissel je tussen drie standen:
veeg **omlaag** voor een groot voorbeeld over het hele scherm, **omhoog** terug naar half/half, en nog eens
**omhoog** voor de invoervelden over het hele scherm. Tikken op de greep wisselt tussen half en invoer.

**Inzoomen:** tik op het voorbeeld om het schermvullend te bekijken. Knijp, tik twee keer of gebruik + / −
om in te zoomen (tot 600%), sleep om te verschuiven. Sluiten met ✕ of de terugknop.

**Exporteren:** op de telefoon opent *Delen / opslaan* het deelmenu (Opslaan in Foto's, Instagram, WhatsApp…).
*Download PNG* slaat het bestand direct op.

## Huisstijl aanpassen

De huisstijl staat op één plek:

- **Logo:** `public/logo.png` (clublogo met transparante achtergrond).
- **Kleuren:** zwart en wit als basis, met goud (`#e0b32a`) als accent. Aan te passen via `colors` in
  `src/theme.ts`; voor de app zelf ook `--accent` in `src/styles.css` en `theme_color` in `vite.config.ts`.
- **Kleurstijlen** in de app: *Zwart* (standaard), *Wit* en *Goud*.
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

Op het startscherm van de app staat een knop **App installeren**. Op Android (Chrome, Samsung Internet) opent die
direct het installatievenster; op iPhone of in andere browsers toont hij stap-voor-stap uitleg. Is de app al
geïnstalleerd, dan verdwijnt de knop.

De workflow `.github/workflows/deploy.yml` bouwt en publiceert de app bij elke push naar `main`.
Eenmalig instellen: **Settings → Pages → Source: GitHub Actions**.
Open daarna de URL op je telefoon en kies *Zet op beginscherm* om de app te installeren.

## Techniek

Vite + React + TypeScript. Afbeeldingen worden getekend op een `<canvas>` op de exacte exportresolutie;
elk template is één bestand in `src/templates/` met zijn velden en een `draw`-functie.
Een nieuw template toevoegen = een bestand maken en het opnemen in `src/templates/index.ts`.
