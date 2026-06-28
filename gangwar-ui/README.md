# GANGWAR – STRADA #1 · Modern Esports UI

Neu gestaltete UI im **Valorant/CS2-Stil** mit scharfen Kanten, Cyan-Neon-Akzenten und modernen Animationen.
Cyan-Farbschema beibehalten (`#33CCFF`).

---

## 📁 Struktur

```
gangwar-ui/
├── index.html              # Einstiegspunkt (lädt CSS + JS)
├── css/
│   ├── config.css          # Farb- und Stil-Variablen
│   ├── fonts.css           # @font-face-Definitionen
│   └── style.css           # Komplettes neues Design
├── js/
│   └── app.js              # UI-Logik + FiveM NUI-Bridge
├── fonts/
│   ├── BebasNeue-Regular.ttf
│   ├── JoyrideSTDItalic.otf
│   └── Gilroy/             # (eigene Gilroy-Dateien hierher kopieren)
└── images/                 # (Logos, kill.png, scoreboard_header.png, …)
```

---

## 🚀 Schnellstart (lokale Vorschau)

Einfach `index.html` im Browser öffnen → Menü wird sofort angezeigt.
Im **FiveM-Kontext** bleibt das Menü versteckt, bis der Server eine NUI-Message schickt.

---

## 🔌 FiveM-Integration

### 1. Dateien in deine Resource kopieren
Ersetze die alten Dateien (`config.css`, `fonts.css`, `index.html`) im `html/`-Ordner deiner Resource.
Füge `css/style.css` und `js/app.js` hinzu.

### 2. `fxmanifest.lua` ergänzen
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

### 3. Resource-Name in `js/app.js`
```js
const RESOURCE_NAME = 'gangwar'; // <-- Name deiner Resource hier
```

### 4. NUI-Messages vom Server senden
```lua
-- Menü öffnen
SendNUIMessage({
  type = 'openMenu',
  stars = 2350,
  zones = {
    { id = 'windraeder', name = 'WINDRÄDER', status = 'wait',   image = '' },
    { id = 'fibhq',      name = 'FIB HQ',    status = 'active', image = '' },
    { id = 'sandy',      name = 'SANDY',     status = 'locked', image = '' },
    -- ...
  }
})

-- HUD aktualisieren
SendNUIMessage({
  type = 'hud',
  data = {
    visible = true,
    timer = '02:14',
    warning = false,
    attacker = { name = 'SANTO',  logo = 'nui://gangwar/html/images/santo.png',  current = 4, max = 6 },
    defender = { name = 'LUNAR',  logo = 'nui://gangwar/html/images/lunar.png',  current = 5, max = 6 },
  }
})

-- Scoreboard zeigen
SendNUIMessage({
  type = 'scoreboard',
  data = {
    visible = true,
    subtitle = 'LUNAR',
    title = 'GEWINNER: SANTO',
    players = {
      { rank = 1, name = 'Nico Dev', kills = 10 },
      { rank = 2, name = 'Max',      kills = 7  },
      -- ...
    }
  }
})

-- MVP einblenden
SendNUIMessage({ type = 'mvp', player = { rank = 1, name = 'Nico Dev', kills = 10 } })

-- Top-Nachricht (Banner)
SendNUIMessage({ type = 'topMessage', text = 'GANGWAR STARTET IN 10 SEKUNDEN', duration = 4000 })
```

### 5. NUI-Callbacks im Server-Lua
```lua
RegisterNUICallback('attackZone', function(data, cb)
  print(('Spieler greift Zone an: %s (%s)'):format(data.zoneName, data.zoneId))
  -- deine Logik...
  cb({ ok = true })
end)

RegisterNUICallback('changeTab', function(data, cb)
  print('Tab gewechselt:', data.tab) -- gangwar | rewards | topfraks | topplayers
  cb({ ok = true })
end)

RegisterNUICallback('closeMenu', function(data, cb)
  SetNuiFocus(false, false)
  cb({ ok = true })
end)
```

---

## 🎨 Anpassungen

### Farben ändern
In `css/config.css`:
```css
:root {
  --main-color: rgb(51, 204, 255);    /* Akzent */
  --background: rgb(8, 10, 14);       /* Dunkler Hintergrund */
  --team-attack: #ff4d6d;             /* Angreifer-Rot */
  --team-defend: #33ccff;             /* Verteidiger-Cyan */
}
```

### Fonts
Bebas Neue (Titel), Gilroy (Body), Joyride (Akzent) bleiben erhalten.

### Zone-Bilder als Karten-Background
In den NUI-Messages `image: 'nui://gangwar/html/images/zones/windraeder.jpg'` setzen.

---

## ✅ Enthaltene Komponenten

| Komponente              | Status   |
|-------------------------|----------|
| Gangwar-Menü (12 Zonen) | ✅ Neu   |
| Tabs                    | ✅ Neu   |
| Sterne-Counter          | ✅ Neu   |
| Schließen-Button        | ✅ Neu   |
| HUD (Attacker/Defender) | ✅ Neu   |
| Center-Timer            | ✅ Neu   |
| Top-Message-Banner      | ✅ Neu   |
| Scoreboard (Rundende)   | ✅ Neu   |
| MVP-Anzeige             | ✅ Neu   |

---

**Hinweis:** Die kompilierten Vite-Bundles (`index-CjEF7Pb7.css`, `index-CpV1msG_.js`, `index-DL6D_OuF.js`) werden **nicht mehr benötigt** – die neue UI ist als saubere Vanilla-JS-Lösung gebaut und direkt FiveM-kompatibel.
