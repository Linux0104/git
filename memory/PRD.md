# LunarOS Tablet — Modern Redesign

## Original Problem Statement
> "das ganze moderner design" — User uploaded 4 files (index.html, app.js, style.css, serve.ps1) of a FiveM NUI Behörden-Tablet (Polizei / Rettungsdienst / Feuerwehr / Justiz) und wollte alles in ein modernes Design umgesetzt haben.

## User Choices (verbatim)
- Stil: **Dark Mode / Futuristic** + Design-Agent darf entscheiden
- Funktionalität: **Nur optisch neu** — keine Funktionsänderungen
- Tech-Stack: **Vanilla HTML/CSS/JS beibehalten**
- Farbe: **„lass dich überraschen"**

## Design Direction Chosen
**„Lunar Command Tactical OS"** — eine HUD/Kommandobrücken-Ästhetik:
- Tiefes Obsidian-Schwarz (`#05070b` / `#0e1219`) statt Standard-Dark-Blue
- **Phosphor-Grün** (`#9dff54`) als einziger Hauptakzent mit Glow-Effekten
- Sekundärtöne: Amber (`#ffb547`), Cinnabar (`#ff5b6e`), Ion-Cyan (`#5ce0ff`)
- Typografie-Pairing: **Sora** (UI/Headlines) + **JetBrains Mono** (Daten/IDs/Codes)
- Bracket-Corner-Frame um App-Shell (typisch für Command-UIs)
- Animated nebula-drift background, scanline overlay + SVG-grain noise
- HUD-Statusleiste mit Live-Clock und LED-Statusanzeigen (Link, Sec Channel, GPS)
- Pulsierender Cursor `_` am Page-Title
- Sharp corners (4–12px), Records mit linker Akzent-Strip + Hover-Slide

## What's Implemented
- ✅ **style.css** komplett neu geschrieben (550 → 730 Zeilen, modernes System mit CSS-Custom-Properties, alle Klassen die `app.js` referenziert bleiben funktional)
- ✅ **index.html** mit dekorativen Ergänzungen: HUD-Status-Chips, Live-Clock-Element + 12-Zeilen Vanilla-JS Clock-Tick. Alle IDs unverändert.
- ✅ **app.js** unverändert — 100% identische Funktionalität
- ✅ **serve.ps1** unverändert
- ✅ Alle 8 Module verifiziert: Dashboard / Personen / Fahndung / Akten / Tickets / Patienten / Leitstelle / Kalender — Stats-Tiles, Forms, Records, Person-Avatare (mit Initialen-Fallback), Selects/Inputs/Textareas, Toggles, Tags, Search.
- ✅ Responsiv: Breakpoints bei 1400px und 1000px

## Files
- `/app/tablet/` — Quelldateien (Originalstandort, modifizierte Versionen)
- `/app/frontend/public/tablet/` — Live-Vorschau via React-Dev-Server

## Live Preview
- URL: `https://design-collective-27.preview.emergentagent.com/tablet/index.html?preview=1`
- Verschiedene Departments testbar via `&dept=police|ambulance|fire|doj`

## Architecture (unchanged)
- Vanilla HTML + CSS + JS
- `app.js` enthält Mock-Daten-Layer für `?preview=1` Modus (kein Backend nötig in Vorschau)
- Production: `app.js` kommuniziert via `fetchNui()` mit FiveM-Resource (`hex_emergency_tablet`)

## Date Log
- **2026-06-15**: Komplettes visuelles Redesign — "Lunar Command" theme. CSS-Rewrite + minimale HTML-Decorations. Keine JS-Logik verändert.

## Next Action Items / Backlog
- (Optional) Print-Stylesheet für Akten-Ausdrucke
- (Optional) Light-Mode Variante
- (Optional) Zusätzliche Department-spezifische Akzentfarben (FD → amber, MD → cinnabar, DOJ → ion)
