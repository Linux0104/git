# 🌙 Lunar — Tebex CMS Theme (Webstore Builder)

Dieses Theme bringt das Lunar-Design direkt in deinen **Tebex-Store** (läuft dann nativ auf
`lunar-shop.tebex.io`, inkl. echter Bezahlung über Tebex.js). Es besteht aus fertigen
**Twig-Templates** + einer **CSS-Datei**, die du im Tebex-Editor einfügst.

---

## 1) Custom Template anlegen
Tebex Control Panel → **Webstore → Appearance** → neues Custom Template auf Basis von **Exo** erstellen
→ **Edit**. Du siehst dann die Datei-Liste (Webstore-Pages + Assets), genau wie in deinen Screenshots.

## 2) CSS als Asset hochladen  ⭐ wichtig zuerst
Unter **Assets → Add** eine neue Datei `lunar.css` anlegen und den kompletten Inhalt aus
`lunar.css` einfügen (oder hochladen). Das Theme lädt sie über `{{ asset('lunar.css') }}`.

## 3) Reusable Asset anlegen
Unter **Assets → Add** eine Datei **`coin-card.twig`** anlegen und den Inhalt aus `coin-card.twig`
einfügen. (Wird von der Startseite & den Kategorien eingebunden.)

## 4) Pages ersetzen
Öffne die folgenden **Webstore-Pages** und ersetze den Inhalt jeweils komplett:

| Tebex-Datei        | Inhalt aus            |
|--------------------|-----------------------|
| `layout.html`      | `layout.html`         |
| `index.html`       | `index.html`          |
| `category.html`    | `category.html`       |
| `package.html`     | `package.html`        |
| `checkout.html`    | `checkout.html`       |

## 5) Sidebar-Module (optional, empfohlen)
Ersetze zusätzlich diese Module-Pages für das Community-Design:

| Tebex-Datei                 | Inhalt aus                   |
|-----------------------------|------------------------------|
| `module.topdonator.html`    | `module.topdonator.html`  → „Top-Kunde des Monats“ |
| `module.payments.html`      | `module.payments.html`    → „Neueste Käufe“        |
| `module.textbox.html`       | `module.textbox.html`                              |

Die Sidebar-Module aktivierst/ordnest du unter **Webstore → Sidebar**
(z. B. „Top Donator“ + „Recent Payments“ hinzufügen).

## 6) Speichern & Aktivieren
Template speichern und unter **Appearance** als aktives Template auswählen. Fertig! 🎉

---

## Hinweise
- **Logo/Favicon**: Lade dein Lunar-Logo unter **Webstore → Appearance → Logo** hoch – es erscheint
  automatisch (`{{ store.logo }}`). Ohne Upload nutzt das Theme das GitHub-Logo als Fallback.
- **Discord-Link**: ist auf `https://discord.gg/lunar-rp` gesetzt (in `layout.html` & `index.html`).
- **Bilder der Pakete**: kommen automatisch aus Tebex (`package.image.url`). Lade sie im Paket-Editor hoch.
- **Preise/Coins**: werden 1:1 aus deinen Tebex-Paketen gezogen – nichts hart kodiert.
- **Checkout**: läuft über **Tebex.js** (nahtloses Zahlungsfenster ohne Weiterleitung), inkl. FiveM-Account-Login.
- **Farben**: Primär `#0055ff`, Akzent `#00e5ff`, Hintergrund `#08080c` (in `lunar.css` änderbar über die `:root`-Variablen).

## Verwendete Tebex-Variablen/Routen (Referenz)
- `store.name`, `store.currency`, `store.logo`, `store.categories`, `category.packages`
- `package.name`, `package.price|money`, `package.image.url`, `package.identifier`, `package.basket`, `package.discount.*`
- Warenkorb: `/checkout/packages/add/{id}/{qty}` · Entfernen: `/checkout/packages/remove/{id}`
- Kasse: `/checkout` (Tebex.js mit `{{ basket.ident }}`) · Login: `/login` · Logout: `/checkout/logout`
