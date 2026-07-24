# Sky Shop — "Lunar PVP" UI Redesign

## Aktuelle Aufgabe (continuation)
> "da sind die sky dateien dran kannst du mir das ui redesign im stile von lunar pvp,
> also vom aussehen her — lunar pvp ist das Beispiel-Foto." (+ angehängtes Screenshot)

Der User hat eine **Sky Coin/VIP-Shop** FiveM-NUI-Resource hochgeladen (Vue 3 / Vite
Build) und möchte, dass sie **optisch** wie das "Lunar PVP" Referenz-UI aussieht
(dunkles Obsidian-Schwarz + elektrisches Cyan, cleaner "tactical" Look, dünne
Cyan-Rahmen, uppercase Labels, outlined Buttons, Glow-Akzente).

## Gelieferte Dateien (User-Uploads)
- `sky-index-B8WVc7MV.js`  — gebauter Vue-3-Shop (minified, ~1 MB)
- `sky-index-Bll-Twme.css` — Original-Styles des Builds (minified)
- `sky-Satoshi-*.otf`      — Satoshi Fonts (im Build gebündelt)

## Deliverable
- **`/app/lunar-pvp-theme.css`** — Drop-in Theme-Override.
  Einbinden NACH dem Original-CSS in der Resource (`source/html/index.html`):
  ```html
  <link rel="stylesheet" href="./assets/index-XXXX.css" />
  <link rel="stylesheet" href="./lunar-pvp-theme.css" />   <!-- NEU -->
  ```

## Technischer Ansatz (warum das robust ist)
- Der Build liest seinen Akzent aus `--primary-color` (inline auf `#app`). Wir
  überschreiben ihn auf **Cyan `#5fe0ff`** → färbt sehr viele Akzente automatisch.
- Der Build nutzt **null `!important`** → unsere class-level `!important`-Overrides
  gewinnen OHNE die `data-v-`-Hashes zu brauchen ⇒ übersteht auch einen Rebuild.
- Fonts: nutzt die vom Build bereits gebündelte **Satoshi**-Family.
- Alle Größen in `vh` (FiveM Vollbild-NUI) beibehalten → Proportionen stimmen.

## Was das Theme stylt
- Shell/Panel: Obsidian-Gradient, dünner Cyan-Rahmen, weiches Cyan-Glow, Frame-Bild entfernt
- Header/Nav: "› VIP SHOP" mit Cyan-Chevron + Cyan-Underline, weißer Titel + Cyan-Glow
- Balance / Redeem-Input / Buttons: Glass + Cyan, outlined Buttons (wie "BEITRETEN")
- Kategorie-Karten: einheitlicher dünner Cyan-Rahmen (statt Regenbogen), uppercase
  weiße Titel über dem Produktbild, Cyan Discount-Chips, Hover-Glow + Lift
- Shop-Produktgrid, Cases (inkl. Rarity-Farben), VIP-Compare, Popups, Code-Validierung → alle auf Cyan/Glass harmonisiert

## Verifikation
- **Vorschau-Setup** unter `/app/frontend/public/sky/`:
  - `index.html` lädt Build + Original-CSS + `lunar-pvp-theme.css` + `preview.css`
  - `mock.js` + `defaults.js` = Preview-only NUI-Mock (postMessage "open" mit
    Beispiel-Shopdaten; Defaults aus dem Bundle extrahiert via `scripts/extract_defaults.js`)
  - `preview.css` = NUR Vorschau (dunkle Bühne + erzwungene opacity), NICHT Teil des Deliverables
- Vorschau-URL: `<APP_URL>/sky/index.html`  (Original-Vergleich: `/sky/index_base.html`)
- **Visuell verifiziert: Hauptseite / Nav / Kategorie-Karten** — matcht die Referenz sehr gut.
- Sub-Seiten (Shop-Grid, Cases, VIP) sind vom Theme abgedeckt, aber im Mock nicht
  vollständig navigierbar (brauchen Live-Server-Daten). Recolor erfolgt sicher über
  den `--primary-color`/`!important`-Mechanismus.

## Offen / Backlog
- Optional: Sub-Seiten (Shop-Produktkarten, Cases, VIP) live am echten Server feinjustieren
- Optional: Discount-Chips in Amber statt Cyan, falls mehr "Aufmerksamkeit" gewünscht
- Optional: eigene Font statt Satoshi, falls Lunar-PVP eine andere Schrift nutzt
