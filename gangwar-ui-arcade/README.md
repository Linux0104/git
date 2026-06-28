# GANGWAR – STRADA #1 · Arcade / Fortnite-Apex Style

Knallbunte UI im Battle-Royale-Look mit Purple→Pink Gradient, dicken gelben Outlines, runden 3D-Buttons und verspielten Pop-Animationen.

---

## 📁 Struktur

```
gangwar-ui-arcade/
├── index.html
├── css/
│   ├── config.css     (Arcade-Farbpalette)
│   ├── fonts.css
│   └── style.css      (Arcade-Design komplett)
├── js/app.js          (gleiche FiveM NUI-Logik)
├── fonts/             (Bebas, Joyride, Gilroy)
└── README.md
```

---

## 🎨 Stil-Highlights

- **Hintergrund:** Purple → Magenta → Pink Gradient mit Confetti-Dot-Overlay
- **Karten:** Schwarze Glass-Karten mit **3px gelber Border** und 8px 3D-Drop-Shadow
- **Buttons:** Pink → Orange Gradient mit weißem Outline, runder Pill-Form (50px radius), 6px 3D-Shadow, drücken sich beim Klick "rein"
- **Titel:** Bebas Neue, leicht **skew(-3deg)**, mit **gestapelten 3D-Text-Shadows** (gelb → pink → purple)
- **Status-Pills:** Pulsierender Dot mit Glow (grün/orange/pink je nach Zustand)
- **Karten-Ecken-Badge:** Pink-Orange Blitz-Symbol ⚡ in jeder Ecke
- **Zone-Icons:** Cyan-Purple Gradient Box, rotiert -6°, gelbe Outline
- **HUD-Timer:** Gelb-Orange Pill mit weißem Outline + Glow
- **Winner-Banner:** Gelb-Orange tile-gerottet (-1.5°) mit massiven 3D-Schatten
- **Animationen:** Cards poppen rein, Buttons heben sich auf Hover, MVP-Bounce-Animation

---

## 🔌 FiveM-Integration (identisch zur Esports-Version)

1. Dateien in `html/`-Ordner deiner Resource kopieren
2. In `js/app.js` den `RESOURCE_NAME` setzen
3. `fxmanifest.lua` erweitern:
   ```lua
   ui_page 'html/index.html'
   files {
     'html/index.html',
     'html/css/*.css',
     'html/js/*.js',
     'html/fonts/**',
     'html/images/**',
   }
   ```

4. NUI-Messages vom Server **funktionieren genauso** wie in der Esports-Variante:
   ```lua
   SendNUIMessage({ type = 'openMenu', stars = 2350, zones = {...} })
   SendNUIMessage({ type = 'hud', data = {...} })
   SendNUIMessage({ type = 'scoreboard', data = {...} })
   SendNUIMessage({ type = 'topMessage', text = '...', duration = 4000 })
   ```

5. NUI-Callbacks identisch: `attackZone`, `changeTab`, `closeMenu`

(Volle Dokumentation siehe README der Esports-Variante — die NUI-Bridge ist 1:1 gleich.)

---

## 🎨 Farben anpassen

In `css/config.css`:
```css
:root {
  --bg-start: #2a1565;      /* Hintergrund-Gradient Start */
  --bg-mid:   #6b1fb5;      /* Mitte */
  --bg-end:   #d63384;      /* Ende */
  --arcade-yellow: #ffd23f; /* Hauptakzent (Outlines, Titel) */
  --arcade-pink:   #ff3d6e; /* Button-Gradient Start */
  --arcade-orange: #ff6b00; /* Button-Gradient Ende */
  --arcade-green:  #5dffb5; /* Status OK */
}
```

---

## ✅ Komponenten

| Komponente              | Status   |
|-------------------------|----------|
| Gangwar-Menü (12 Zonen) | ✅ Arcade |
| Tabs (Pill-Style)       | ✅ Arcade |
| Sterne-Counter          | ✅ Arcade |
| Schließen-Button (rund) | ✅ Arcade |
| HUD (Attacker/Defender) | ✅ Arcade |
| Center-Timer (gelb)     | ✅ Arcade |
| Top-Message-Banner      | ✅ Arcade |
| Scoreboard (geneigt)    | ✅ Arcade |
| MVP-Anzeige (gold)      | ✅ Arcade |
