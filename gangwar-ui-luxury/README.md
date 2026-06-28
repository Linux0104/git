# GANGWAR – STRADA #1 · Luxury Black-Gold

Edle, minimalistische UI im Premium-Look — schwarz mit Gold-Akzenten, Serif-Schrift, dünne Linien und subtile Animationen.
**Enthält nur:** Menü · HUD · Top-Message *(KEIN Scoreboard/MVP wie gewünscht)*

---

## 📁 Struktur

```
gangwar-ui-luxury/
├── index.html
├── css/
│   ├── config.css     (Gold-Palette)
│   ├── fonts.css
│   └── style.css      (Luxury Design komplett)
├── js/app.js          (FiveM NUI-Logik)
├── fonts/             (Bebas, Joyride, Gilroy hier rein)
└── README.md
```

---

## 🎨 Design-Highlights

- **Pure Black** Hintergrund (`#0a0908`) mit subtilem Dot-Pattern
- **Gold-Gradient-Titel** (`#f5e9b9` → `#d4af37`) in Georgia Serif, mit Spacing 14px
- **Diamant-Akzente** (◆) als Trenner & Indikatoren
- **Eck-Klammern** (top-left, bottom-right L-Shapes) auf jeder Box
- **Italic-Subtitle** "— LUNAR —"
- **Tabs** mit Underline-Animation + Diamond-Top-Marker
- **Cards** mit dünner Gold-Border, weichen Eck-Akzenten die beim Hover wachsen
- **Button:** transparenter Gold-Outline → beim Hover gleitet ein **Gold-Sweep von links** rein, der Pfeil → rückt sanft
- **HUD:** Slim Gold-Bars (6px), Logos mit Eck-Akzenten, Timer mit Gold-Outline und Glow
- **Top-Message:** „— ◆ TEXT ◆ —" als elegantes Banner

---

## 🔌 FiveM-Integration

### 1. Dateien in `html/`-Ordner kopieren
### 2. `js/app.js` – `RESOURCE_NAME` setzen
### 3. `fxmanifest.lua`:
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
    -- status: 'wait' | 'active' | 'locked'
  }
})

-- HUD aktualisieren
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

-- Top-Message anzeigen
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
  print('Tab:', data.tab) -- gangwar | rewards | topfraks | topplayers
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
  --gold:           #d4af37;   /* Hauptgold */
  --gold-bright:    #f5e9b9;   /* Highlight */
  --gold-deep:      #a8841e;   /* Schatten */
  --black:          #0a0908;   /* Hintergrund */
  --black-elevated: #1c1812;   /* Karten-Top */
}
```

Möchtest du z. B. **Silber statt Gold**?
```css
--gold:           #c0c0c0;
--gold-bright:    #f0f0f0;
--gold-deep:      #808080;
```

Oder **Roségold**?
```css
--gold:           #b76e79;
--gold-bright:    #e8b8c0;
--gold-deep:      #804651;
```

---

## ✅ Enthaltene Komponenten

| Komponente              | Status   |
|-------------------------|----------|
| Gangwar-Menü (12 Zonen) | ✅ Luxury |
| Tabs (Underline)        | ✅ Luxury |
| Sterne-Counter          | ✅ Luxury |
| Schließen-Button        | ✅ Luxury |
| HUD (slim, gold)        | ✅ Luxury |
| Center-Timer            | ✅ Luxury |
| Top-Message             | ✅ Luxury |
| ~~Scoreboard~~          | ❌ entfernt |
| ~~MVP~~                 | ❌ entfernt |
