# Fahrstuhl NUI – LUNAR UI Redesign

## Aufgabe
Bestehendes FiveM Fahrstuhl-NUI (index.html/app.js/style.css) rein optisch auf das
"LUNAR UI Design System" umbauen. Funktion unverändert. Nur UI-Redesign.

## Design System (LUNAR)
Navy + Cyan, scharfe 6px-Ecken (kein Pill), Uppercase-Labels mit letter-spacing 0.2em,
Behörden/HUD-Look. Fonts: Rajdhani (Titel/Buttons/Zahlen/Labels 700 uppercase) +
Chakra Petch (Fließtext). Akzent #3ccfff. FiveM-Pflicht: kein color-scheme:dark,
body transparent !important, sichtbar via body.visible, kein backdrop-filter, Inline-SVG.

## Umgesetzt (2026-07-22)
- Neues index.html: Shell mit Cyan-Glow-Linie, Header (SVG Schild+Stern-Badge, Kicker,
  Titel mit cyanem >, Stat-Boxen, Close-Button), 2-Spalten Floor-Grid, Message-Bar.
- style.css: komplettes LUNAR Token-Set, shellIn-Animation, Karten mit 2px Akzent-Balken,
  .active Highlight, Status-Pills (cyan/danger/grau), spezifische Transitions.
- app.js: DOM an neues Layout angepasst, body.visible Logik, texts-Objekt überschreibbar,
  FiveM message/post-Handling erhalten (open/close/setBusy/showError/selectFloor), Preview-Mount.

## Deliverable-Pfad
/app/frontend/public/elevator/  (index.html + assets/css/style.css + assets/js/app.js)
Vorschau: {FRONTEND_URL}/elevator/index.html

## Next / Backlog
- P1: Google-Fonts offline bundeln (woff2 lokal) für 100% Offline-FiveM.
- P2: Optionale Lua-Files (fxmanifest/client/server) falls komplettes Skript gewünscht.
