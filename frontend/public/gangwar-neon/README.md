# GANGWAR – STRADA #1 · Dark Neon Turquoise

Futuristische UI mit **neuem Layout** im dunklen Neon-Stil mit Türkis-Akzent.
**Enthält:** Menü · HUD · Top-Message *(KEIN Scoreboard/MVP)*

---

## 🎨 Neues Layout

Komplett anderes Layout als die Standard-Grid-Variante:

```
┌─────────────┬──────────────────────────────────────┐
│             │  SECTOR  > GANGWAR    12 ZONES   [×] │ ← Header
│  GANG WAR   ├──────────────────────────────────────┤
│  ▪▪▫▫       │                                      │
│             │  [⚔️] WINDRÄDER      ●  [ANGREIFEN]  │
│ ▌ GANGWAR  •│  [⚔️] WINDRÄDER 2    ●  [ANGREIFEN]  │
│   REWARDS   │  [⚔️] FLUGZEUGFR..   ●  [ANGREIFEN]  │
│   TOP FRAKS │  [⚔️] FIB HQ         ●  [ANGREIFEN]  │
│   PLAYERS   │  ... (12 Zonen in 2 Spalten)         │
│             │                                      │
├─────────────┤                                      │
│ ★ 2,350     │                                      │
└─────────────┴──────────────────────────────────────┘
   Sidebar              Main Content
```

- **Vertikale Sidebar (240px)** links: Brand-Logo „GANG**WAR**", Nav mit Icons + Text, aktiver Tab mit Border-Left & blinkendem Dot
- **Top-Header** mit Sector-Label, Titel mit „>" Prompt, Zonen-Counter, Close-Button
- **Horizontale Zone-Cards** in 2 Spalten: 60×60 Icon-Tile mit Eck-Akzent, Name + Pulsing-Status-Dot, „ANGREIFEN"-Button rechts mit Sweep-Fill-Animation
- **Sidebar-Footer:** Sterne-Counter mit „Punkte"-Label

---

## 🌈 Farben

- **Neon Türkis:** `#00ffd0` (Hauptakzent)
- **Neon Bright:** `#66ffe0` (Highlights)
- **Background:** `#050709` (fast schwarz)
- **Grid-Lines** (subtil) im Hintergrund mit Radial-Mask
- **Scanline-Overlay** für Tech-Feel
- **Glow-Effekte** überall auf interaktiven Elementen

---

## 🎨 Design-Highlights

- **Brand "GANG·WAR"** mit Türkis-Hervorhebung auf zweiter Silbe
- **Status-Bar** unter Brand: 4 Segmente, erstes leuchtet Türkis
- **Active-Tab** mit Linker-Border, Background-Gradient & blinkendem Dot rechts
- **Header-Titel** mit „> " Prompt-Prefix (Türkis-Glow)
- **Karten:** Linker Türkis-Strich schiebt rein beim Hover (scaleY)
- **Icon-Tile** mit Türkis-Eck-Akzent (top-left) und subtilem Glow
- **„ANGREIFEN"-Button:** transparent → Türkis-Sweep beim Hover (links nach rechts), Text wird dunkel
- **Button-Ecke** unten rechts: kleines 2px Türkis-Eckwinkel
- **Status-Dot pulsiert** in passender Farbe (Türkis = wait, Orange = active, Pink = locked)
- **HUD-Timer:** mit horizontalen Türkis-Linien oben & unten, starker Glow
- **HUD-Bars:** Shimmer-Animation (Welle wandert durch)
- **Top-Message:** zwischen zwei Türkis-Linien, mit Backdrop-Blur

---

## 📁 Struktur

```
gangwar-ui-neon/
├── index.html
├── css/
│   ├── config.css     (Türkis-Palette + Layout-Variablen)
│   ├── fonts.css
│   └── style.css      (Neon Design + neues Layout)
├── js/app.js          (FiveM NUI-Logik)
├── fonts/             (Bebas, Joyride, Gilroy)
└── README.md
```

---

## 🔌 FiveM-Integration

### 1. Dateien in `html/`-Ordner deiner Resource kopieren

### 2. `js/app.js` — `RESOURCE_NAME` setzen
```js
const RESOURCE_NAME = 'gangwar';
```

### 3. `fxmanifest.lua`
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

### 4. Server NUI-Messages
```lua
-- Menü öffnen
SendNUIMessage({
  type = 'openMenu',
  stars = 2350,
  zones = {
    { id = 'windraeder', name = 'WINDRÄDER', status = 'wait' },
    { id = 'fibhq',      name = 'FIB HQ',    status = 'active' },
    { id = 'sandy',      name = 'SANDY',     status = 'locked' },
    -- ...
  }
})

-- HUD updaten
SendNUIMessage({
  type = 'hud',
  data = {
    visible = true,
    timer = '02:14',
    warning = false,
    attacker = { name = 'SANTO', logo = 'nui://gangwar/html/images/santo.png', current = 4, max = 6 },
    defender = { name = 'LUNAR', logo = 'nui://gangwar/html/images/lunar.png', current = 5, max = 6 },
  }
})

-- Top-Message
SendNUIMessage({ type = 'topMessage', text = 'GANGWAR STARTET IN 10 SEKUNDEN', duration = 4000 })

-- Sterne updaten
SendNUIMessage({ type = 'updateStars', stars = 3500 })

-- Menü schließen
SendNUIMessage({ type = 'closeMenu' })
```

### 5. NUI-Callbacks (Server-Lua)
```lua
RegisterNUICallback('attackZone', function(data, cb)
  print('Zone angegriffen:', data.zoneName, data.zoneId)
  cb({ ok = true })
end)

RegisterNUICallback('changeTab', function(data, cb)
  print('Tab:', data.tab)
  cb({ ok = true })
end)

RegisterNUICallback('closeMenu', function(data, cb)
  SetNuiFocus(false, false)
  cb({ ok = true })
end)
```

---

## 🎨 Farben anpassen

In `css/config.css`:
```css
:root {
  --neon:        #00ffd0;   /* Hauptakzent */
  --neon-bright: #66ffe0;
  --neon-dim:    #00b894;
  --bg:          #050709;   /* Hintergrund */
}
```

Alternative Neon-Farben:
- **Neon Grün:** `--neon: #00ff88;` mit `--neon-bright: #66ffaa;`
- **Neon Pink:** `--neon: #ff3d94;` mit `--neon-bright: #ff7ab8;`
- **Neon Violet:** `--neon: #b347ff;` mit `--neon-bright: #d28aff;`
- **Klassisches Cyan:** `--neon: #00f0ff;` mit `--neon-bright: #80f7ff;`

---

## ✅ Komponenten

| Komponente              | Status   |
|-------------------------|----------|
| Sidebar-Navigation      | ✅ Neon  |
| Brand-Logo "GANG·WAR"   | ✅ Neon  |
| Header mit Counter      | ✅ Neon  |
| Zone-Cards (horizontal) | ✅ Neon  |
| Sterne-Counter (footer) | ✅ Neon  |
| Schließen-Button        | ✅ Neon  |
| HUD (slim + shimmer)    | ✅ Neon  |
| Center-Timer            | ✅ Neon  |
| Top-Message             | ✅ Neon  |
| ~~Scoreboard~~          | ❌ entfernt |
| ~~MVP~~                 | ❌ entfernt |
