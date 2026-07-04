/* =========================================================
   Lunar Garage — FiveM NUI (beautified)
   Compatible with the original NUI message protocol.
   =========================================================
   NUI events accepted on window "message":
     { action: "open",  context, vehicles: [...], defaultImage?, title?, subtitle?, trackOutside? }
     { action: "close" }

   POSTs sent to the resource:
     close, toggleFavourite, renameVehicle, storeVehicle, spawnVehicle
*/

const state = {
  context: "garage",       // "garage" | "impound"
  view: "park-out",        // "park-out" | "park-in" | "favourites" | "impound"
  vehicles: [],
  search: "",
  renamePlate: null,
  defaultImage: "./assets/img/header-Car.png",
  trackOutside: true,
  isFiveM: typeof GetParentResourceName === "function",
};

const $container   = $(".container");
const $editMenu    = $(".edit-menu");
const $carList     = $(".carlist");
const $searchInput = $(".search-input");
const $renameInput = $(".input-name");
const $headerBtns  = $(".header-btn");

/* ----------------- Utilities ----------------- */
function post(endpoint, data = {}) {
  if (!state.isFiveM) return $.Deferred().resolve({ success: true, message: (data && data.name) || "" }).promise();
  return $.post(`https://${GetParentResourceName()}/${endpoint}`, JSON.stringify(data));
}

function escapeHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ----------------- Sound Engine (WebAudio synth, no external files) ----------------- */
const SFX = (() => {
  let ctx = null;
  let muted = false;
  const getCtx = () => {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const play = ({ freq = 440, type = "sine", dur = 0.08, vol = 0.06, sweep = 0, delay = 0 }) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };
  return {
    hover:   () => play({ freq: 720, type: "sine", dur: 0.055, vol: 0.025 }),
    click:   () => { play({ freq: 620, type: "triangle", dur: 0.05, vol: 0.05 }); play({ freq: 960, type: "sine", dur: 0.06, vol: 0.03, delay: 0.04 }); },
    tab:     () => { play({ freq: 520, type: "square",   dur: 0.045, vol: 0.035 }); play({ freq: 780, type: "sine",     dur: 0.06,  vol: 0.03, delay: 0.03 }); },
    open:    () => { play({ freq: 320, type: "sine", dur: 0.15, vol: 0.05, sweep: 480 }); play({ freq: 640, type: "sine", dur: 0.18, vol: 0.04, delay: 0.05, sweep: 320 }); },
    close:   () => { play({ freq: 660, type: "sine", dur: 0.15, vol: 0.05, sweep: -300 }); },
    fav:     () => { play({ freq: 880, type: "triangle", dur: 0.07, vol: 0.05 }); play({ freq: 1320, type: "sine", dur: 0.08, vol: 0.04, delay: 0.05 }); },
    error:   () => { play({ freq: 220, type: "sawtooth", dur: 0.15, vol: 0.05, sweep: -60 }); },
    setMuted(m) { muted = !!m; },
    isMuted() { return muted; },
  };
})();

/* Aggressive Sportlimousine im Lancer Evo Stil — Seitenansicht mit Heckflügel,
   Hood-Scoop, kantigen Frontscheinwerfern und markanten BBS-Speichen. */
const _svgUID = () => "u" + Math.random().toString(36).slice(2, 8);
function buildCarSVG() {
  const b = _svgUID(), g = _svgUID(), s = _svgUID(), r = _svgUID(), hl = _svgUID(), hd = _svgUID();
  return `
<svg viewBox="0 0 360 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="#e9f0fb" stop-opacity="0.98"/>
      <stop offset="0.35" stop-color="#7f97b8" stop-opacity="0.95"/>
      <stop offset="0.7"  stop-color="#2b3446" stop-opacity="0.98"/>
      <stop offset="1"    stop-color="#0b1120" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a1020" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="#1c2b45" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#5EE9FF" stop-opacity="0.35"/>
    </linearGradient>
    <radialGradient id="${s}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#000" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${r}" cx="0.5" cy="0.5" r="0.6">
      <stop offset="0"    stop-color="#4a5a7a"/>
      <stop offset="0.55" stop-color="#1a2233"/>
      <stop offset="1"    stop-color="#05070d"/>
    </radialGradient>
    <linearGradient id="${hl}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"   stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.7"/>
      <stop offset="1"   stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${hd}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffcc55"/>
      <stop offset="0.6" stop-color="#fff5c8"/>
      <stop offset="1" stop-color="#ffe680"/>
    </linearGradient>
  </defs>

  <!-- Bodenschatten -->
  <ellipse cx="180" cy="115" rx="155" ry="5" fill="url(#${s})"/>

  <!-- Heckspoiler (Wing) -->
  <path d="M18 68
           L 18 62
           C 18 60, 20 59, 22 59
           L 60 59
           C 62 59, 63 60, 63 62
           L 63 66
           L 55 68 Z"
        fill="#12192a" stroke="rgba(255,255,255,0.18)" stroke-width="0.6"/>
  <!-- Wing stützen -->
  <rect x="26" y="66" width="2.5" height="8" fill="#0d1120"/>
  <rect x="50" y="66" width="2.5" height="8" fill="#0d1120"/>

  <!-- Karosserie: Sedan mit aggressiver Front -->
  <path d="M20 100
           C 22 84, 30 76, 46 74
           L 68 72
           L 82 68
           C 92 60, 108 52, 132 48
           C 158 44, 190 46, 220 56
           L 250 66
           C 270 72, 290 76, 306 82
           C 324 84, 336 90, 338 100
           L 335 106
           C 335 108, 334 109, 332 109
           L 274 109
           C 272 100, 262 92, 250 92
           C 238 92, 228 100, 226 109
           L 130 109
           C 128 100, 118 92, 106 92
           C 94 92, 84 100, 82 109
           L 24 109
           C 22 109, 20 108, 20 106 Z"
        fill="url(#${b})" stroke="rgba(255,255,255,0.16)" stroke-width="0.8"/>

  <!-- Motorhaube Kante -->
  <path d="M220 56 L 232 62 L 250 68" stroke="rgba(0,0,0,0.35)" stroke-width="0.7" fill="none"/>

  <!-- Hood Scoop (Luftöffnung auf Motorhaube) -->
  <path d="M240 66 L 268 70 L 272 76 L 244 74 Z"
        fill="#0a0f1c" stroke="rgba(255,255,255,0.28)" stroke-width="0.6"/>
  <rect x="248" y="70" width="20" height="2" fill="rgba(0,0,0,0.7)"/>

  <!-- Fensterfläche -->
  <path d="M92 72
           C 104 60, 122 52, 144 50
           C 168 48, 194 52, 216 62
           L 224 72
           L 108 72 Z"
        fill="url(#${g})" opacity="0.95"/>

  <!-- Fensterhighlight -->
  <path d="M100 66 C 130 54, 180 54, 210 62" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" fill="none"/>

  <!-- B-Säule -->
  <path d="M158 50 L 160 72" stroke="rgba(0,0,0,0.5)" stroke-width="1"/>
  <!-- C-Säule -->
  <path d="M108 62 L 110 72" stroke="rgba(0,0,0,0.35)" stroke-width="0.6"/>

  <!-- Türlinie -->
  <path d="M158 72 L 158 92" stroke="rgba(0,0,0,0.4)" stroke-width="0.6"/>
  <!-- Karosserie-Sicke -->
  <path d="M46 90 C 120 84, 240 84, 322 92" stroke="url(#${hl})" stroke-width="0.9" fill="none"/>
  <!-- Untere Sicke / Sideskirt -->
  <path d="M60 100 L 320 100" stroke="rgba(94,233,255,0.35)" stroke-width="0.6" stroke-linecap="round"/>

  <!-- Frontscheinwerfer (Xenon-Streifen, kantig) -->
  <path d="M310 78 L 336 82 L 338 86 L 314 88 Z" fill="url(#${hd})"/>
  <path d="M312 80 L 332 84" stroke="#fff" stroke-width="0.6" opacity="0.9"/>
  <ellipse cx="326" cy="84" rx="3.5" ry="1" fill="#fff" opacity="0.95"/>

  <!-- Kühlergrill -->
  <path d="M292 100 L 332 102 L 332 108 L 292 106 Z" fill="rgba(0,0,0,0.75)"/>
  <path d="M296 103 L 328 105" stroke="rgba(94,233,255,0.4)" stroke-width="0.4"/>
  <!-- Frontlippe -->
  <path d="M292 108 L 330 110" stroke="#0b0e17" stroke-width="1.4"/>

  <!-- Rücklicht -->
  <path d="M20 82 L 44 78 L 46 88 L 22 90 Z" fill="rgba(255,80,100,0.95)"/>
  <path d="M22 84 L 42 82" stroke="#fff" stroke-width="0.4" opacity="0.6"/>
  <rect x="26" y="102" width="18" height="4" rx="1" fill="rgba(0,0,0,0.6)"/>

  <!-- Türgriffe -->
  <rect x="126" y="82" width="14" height="1.6" rx="0.8" fill="rgba(0,0,0,0.55)"/>
  <rect x="204" y="82" width="14" height="1.6" rx="0.8" fill="rgba(0,0,0,0.55)"/>

  <!-- Seitliche Kühlöffnung (Fender Vent) -->
  <path d="M188 76 L 202 76 L 204 82 L 186 82 Z" fill="rgba(0,0,0,0.55)"/>
  <path d="M190 79 L 202 79" stroke="rgba(94,233,255,0.4)" stroke-width="0.3"/>

  <!-- Radhäuser (aggressiv, ausgestellt) -->
  <path d="M76 109 A 28 28 0 0 1 136 109 Z" fill="rgba(0,0,0,0.55)"/>
  <path d="M220 109 A 28 28 0 0 1 280 109 Z" fill="rgba(0,0,0,0.55)"/>

  <!-- Hinterrad — BBS-Style Speichen -->
  <circle cx="106" cy="109" r="20" fill="url(#${r})" stroke="rgba(255,255,255,0.32)" stroke-width="0.9"/>
  <circle cx="106" cy="109" r="15" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.4"/>
  <circle cx="106" cy="109" r="6"  fill="#0a0f1a" stroke="rgba(255,255,255,0.15)" stroke-width="0.4"/>
  <circle cx="106" cy="109" r="2"  fill="rgba(94,233,255,0.95)"/>
  <g stroke="rgba(220,232,255,0.65)" stroke-width="1.2" stroke-linecap="round">
    <line x1="106" y1="94"  x2="106" y2="124"/>
    <line x1="91"  y1="109" x2="121" y2="109"/>
    <line x1="95"  y1="98"  x2="117" y2="120"/>
    <line x1="95"  y1="120" x2="117" y2="98"/>
    <line x1="99"  y1="95"  x2="113" y2="123"/>
    <line x1="99"  y1="123" x2="113" y2="95"/>
  </g>
  <!-- Rote Bremsanlage -->
  <path d="M100 118 A 8 8 0 0 1 112 118" fill="none" stroke="#e63946" stroke-width="1.6" opacity="0.9"/>

  <!-- Vorderrad -->
  <circle cx="250" cy="109" r="20" fill="url(#${r})" stroke="rgba(255,255,255,0.32)" stroke-width="0.9"/>
  <circle cx="250" cy="109" r="15" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.4"/>
  <circle cx="250" cy="109" r="6"  fill="#0a0f1a" stroke="rgba(255,255,255,0.15)" stroke-width="0.4"/>
  <circle cx="250" cy="109" r="2"  fill="rgba(94,233,255,0.95)"/>
  <g stroke="rgba(220,232,255,0.65)" stroke-width="1.2" stroke-linecap="round">
    <line x1="250" y1="94"  x2="250" y2="124"/>
    <line x1="235" y1="109" x2="265" y2="109"/>
    <line x1="239" y1="98"  x2="261" y2="120"/>
    <line x1="239" y1="120" x2="261" y2="98"/>
    <line x1="243" y1="95"  x2="257" y2="123"/>
    <line x1="243" y1="123" x2="257" y2="95"/>
  </g>
  <path d="M244 118 A 8 8 0 0 1 256 118" fill="none" stroke="#e63946" stroke-width="1.6" opacity="0.9"/>
</svg>`;
}
const CAR_SVG_STATIC = buildCarSVG();

/* ----------------- Rendering ----------------- */
function updateHeaderButtons() {
  const [b1, b2, b3] = $headerBtns.toArray().map((el) => $(el));

  if (state.context === "impound") {
    b1.text("Abholen").addClass("aktivBtn");
    b2.hide();
    b3.hide();
    return;
  }

  b1.text("Ausparken").show().toggleClass("aktivBtn", state.view === "park-out");
  b2.text("Einparken").show().toggleClass("aktivBtn", state.view === "park-in");
  b3.text("Favoriten").show().toggleClass("aktivBtn", state.view === "favourites");
}

function getVisibleVehicles() {
  const q = state.search.trim().toLowerCase();
  return state.vehicles.filter((v) => {
    const match = !q || (v.label || "").toLowerCase().includes(q) || (v.plate || "").toLowerCase().includes(q);
    if (!match) return false;
    if (state.context === "impound") return true;
    if (state.view === "park-in") return v.active;
    if (state.view === "favourites") return !!v.isFav;
    return !v.active;
  });
}

function updateFooterStats() {
  const parked = state.vehicles.filter((v) => v.stored && !v.active).length;
  const impound = state.vehicles.filter((v) => !v.stored && !v.active).length;
  const out = state.vehicles.filter((v) => v.active).length;
  $('[data-testid="stat-parked"]').text(parked);
  $('[data-testid="stat-impound"]').text(impound);
  $('[data-testid="stat-out"]').text(out);
}

function renderVehicles() {
  const vehicles = getVisibleVehicles();
  $carList.empty();

  if (!vehicles.length) {
    $carList.html(`
      <div class="empty-state" data-testid="empty-state">
        <p class="empty-title">Keine Fahrzeuge gefunden</p>
        <p class="empty-desc">Passe die Suche oder den Tab an, um Fahrzeuge zu sehen.</p>
      </div>`);
    updateFooterStats();
    return;
  }

  vehicles.forEach((v) => {
    const favClass = v.isFav ? "active" : "";
    const impounded = !v.stored && !v.active;
    const statusClass = impounded ? "impounded" : ((state.context === "impound" || v.active) ? "not-parked" : "");
    const statusText = state.context === "impound"
      ? (v.active ? "Ausgeparkt" : "Im Impound")
      : v.active ? "Ausgeparkt" : impounded ? "Im Impound" : "Eingeparkt";

    const actionsHtml = state.context === "impound" ? "" : `
      <button class="action-btn fav-toggle ${favClass}" data-plate="${escapeHtml(v.plate)}" data-testid="fav-${escapeHtml(v.plate)}" title="Favorit umschalten">
        <svg viewBox="0 0 17 17" fill="currentColor"><path d="M8.5 0.5l2.4 5.3 5.6.5-4.3 3.9 1.3 5.6L8.5 12.9 3.5 15.8l1.3-5.6L.5 6.3l5.6-.5L8.5 0.5z"/></svg>
      </button>
      <button class="action-btn rename-action" data-plate="${escapeHtml(v.plate)}" data-testid="rename-${escapeHtml(v.plate)}" title="Umbenennen">
        <svg viewBox="0 0 19 19" fill="currentColor"><path d="M15.4.02c-.3.06-.5.15-.8.31-.2.15-1.7 1.6-1.7 1.68 0 .05 4 4.07 4.07 4.07.02 0 .4-.36.83-.81.66-.67.82-.85.94-1.07.33-.63.34-1.3.02-1.94-.1-.2-.26-.38-.9-1.02-.82-.84-1.03-1-1.48-1.14a2 2 0 0 0-.98-.07zM6.5 8.44 1.15 13.86c-.48 1.87-1.15 4.65-1.15 4.75 0 .19.2.39.38.39.16 0 4.72-1.13 4.87-1.21.06-.03 2.47-2.41 5.35-5.29l5.23-5.23-2.04-2.05c-1.12-1.12-2.05-2.04-2.06-2.04L6.5 8.44z"/></svg>
      </button>`;

    const imgSrc = v.image || state.defaultImage || "";
    const carImg = imgSrc
      ? `<img class="car-preview" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(v.label)}" onload="this.closest('.car-visual')?.classList.add('has-photo')" onerror="this.remove()" />`
      : "";

    $carList.append(`
      <div class="carlist-item" data-plate="${escapeHtml(v.plate)}" data-testid="car-${escapeHtml(v.plate)}">
        <div class="top-carCtn">
          <div class="plate">
            <div class="plate-inner">
              <div class="plate-top">
                <span class="plate-sticker blue">MAY</span>
                <span class="plate-region">San Andreas</span>
                <span class="plate-sticker orange">•</span>
              </div>
              <p class="plate-value">${escapeHtml(v.plate)}</p>
            </div>
          </div>
          <div class="car-actions">${actionsHtml}</div>
        </div>
        <div class="car-visual">
          <div class="car-svg-bg">${buildCarSVG()}</div>
          ${carImg}
          <div class="car-glow"></div>
        </div>
        <div class="car-infos">
          <div class="car-status">
            <div class="car-dot ${statusClass}"></div>
            <p class="car-StatusName ${statusClass}">${escapeHtml(statusText)}</p>
          </div>
          <p class="car-name">${escapeHtml(v.label || "Unbekanntes Fahrzeug")}</p>
          ${v.category ? `<p class="car-sub">${escapeHtml(v.category)}</p>` : ""}
        </div>
        <div class="line-bottom"></div>
        <div class="blur-bottom"></div>
      </div>
    `);
  });

  updateFooterStats();
}

/* ----------------- Rename Modal ----------------- */
function openRenameMenu(plate) {
  const v = state.vehicles.find((e) => e.plate === plate);
  if (!v) return;
  state.renamePlate = plate;
  $renameInput.val(v.label || "");
  $editMenu.addClass("open").css("display", "flex");
  SFX.open();
  setTimeout(() => $renameInput.trigger("focus"), 50);
}
function closeRenameMenu() {
  const wasOpen = $editMenu.hasClass("open");
  state.renamePlate = null;
  $renameInput.val("");
  $editMenu.removeClass("open").hide();
  if (wasOpen) SFX.close();
}

/* ----------------- UI lifecycle ----------------- */
function closeUi() {
  state.search = "";
  state.renamePlate = null;
  $searchInput.val("");
  $container.hide();
  $editMenu.removeClass("open").hide();
}

function openUi(payload) {
  state.context = payload.context || "garage";
  state.view = state.context === "impound" ? "impound" : "park-out";
  state.vehicles = Array.isArray(payload.vehicles) ? payload.vehicles : [];
  state.search = "";
  state.defaultImage = typeof payload.defaultImage === "string" ? payload.defaultImage : "";
  state.trackOutside = payload.trackOutside !== false;

  $(".menu-title").text(payload.title || "Garage");
  $(".menu-secTitle").text(payload.subtitle || "Lunar");
  $(".prim-Name").text(payload.renameTitle || "Fahrzeug umbenennen");
  $(".menu-desc").text(payload.renameDescription || "Gib deinem Fahrzeug einen neuen Namen — max. 24 Zeichen.");

  $searchInput.val("");
  $container.show();
  closeRenameMenu();
  updateHeaderButtons();
  renderVehicles();
  SFX.open();
}

/* ----------------- Events ----------------- */
window.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.action === "open") openUi(data);
  if (data.action === "close") closeUi();
});

$(".close-btn").on("click", () => { SFX.close(); post("close"); });

$headerBtns.eq(0).on("click", () => {
  if (state.context === "impound") return;
  if (state.view !== "park-out") SFX.tab();
  state.view = "park-out"; updateHeaderButtons(); renderVehicles();
});
$headerBtns.eq(1).on("click", () => {
  if (state.context === "impound") return;
  if (state.view !== "park-in") SFX.tab();
  state.view = "park-in"; updateHeaderButtons(); renderVehicles();
});
$headerBtns.eq(2).on("click", () => {
  if (state.context === "impound") return;
  if (state.view !== "favourites") SFX.tab();
  state.view = "favourites"; updateHeaderButtons(); renderVehicles();
});

$(document).on("mouseenter", ".header-btn, .action-btn, .close-btn", () => {});
// Hover-Sounds bewusst deaktiviert — nur explizite Aktionen erzeugen Ton.

$searchInput.on("input", function () {
  state.search = $(this).val() || "";
  renderVehicles();
});

$(document).on("click", ".fav-toggle", function (e) {
  e.stopPropagation();
  const plate = $(this).data("plate");
  const v = state.vehicles.find((x) => x.plate === plate);
  if (!v) return;
  v.isFav = !v.isFav;
  SFX.fav();
  post("toggleFavourite", { plate, state: v.isFav });
  renderVehicles();
});

$(document).on("click", ".rename-action", function (e) {
  e.stopPropagation();
  if (state.context === "impound") return;
  openRenameMenu($(this).data("plate"));
});

$(document).on("click", ".carlist-item", function () {
  const plate = $(this).data("plate");
  const v = state.vehicles.find((x) => x.plate === plate);
  if (!v) return;
  SFX.click();

  if (state.context === "impound") return post("spawnVehicle", { plate });
  if (state.view === "park-in" || v.active) return post("storeVehicle", { plate });
  post("spawnVehicle", { plate });
});

$(".cancel").on("click", closeRenameMenu);

$(".ready").on("click", () => {
  const name = ($renameInput.val() || "").trim();
  if (!state.renamePlate) return;
  SFX.click();
  post("renameVehicle", { plate: state.renamePlate, name }).done((response) => {
    if (!response || !response.success) return;
    const v = state.vehicles.find((x) => x.plate === state.renamePlate);
    if (v) v.label = response.message || name;
    closeRenameMenu();
    renderVehicles();
  });
});

$renameInput.on("keydown", (e) => { if (e.key === "Enter") $(".ready").trigger("click"); });

$(document).on("keydown", (e) => {
  if (e.key === "Escape") {
    if ($editMenu.is(":visible")) return closeRenameMenu();
    post("close");
  }
});
/* ----------------- Mute Button ----------------- */
$(document).on("click", ".mute-btn", function () {
  const now = !SFX.isMuted();
  SFX.setMuted(now);
  $(this).toggleClass("muted", now);
  try { localStorage.setItem("lunar-garage-muted", now ? "1" : "0"); } catch (e) {}
  if (!now) SFX.click();
});
try {
  if (localStorage.getItem("lunar-garage-muted") === "1") {
    SFX.setMuted(true);
    $(".mute-btn").addClass("muted");
  }
} catch (e) {}
// Resume AudioContext on first user gesture (browser autoplay policy)
$(document).one("pointerdown keydown", () => { try { SFX.hover(); } catch (e) {} });



/* ----------------- Preview Mode -----------------
   When previewed in a normal browser (not FiveM),
   auto-load with demo data so the UI is visible.
*/
if (!state.isFiveM) {
  const demoVehicles = [
    { plate: "LN-9F1X", label: "Mitsubishi Lancer Evolution X", category: "Sport",   stored: true,  active: false, isFav: true  },
    { plate: "BM-4M3T", label: "BMW M3 Competition",             category: "Sport",   stored: true,  active: false, isFav: false },
    { plate: "AU-R8V0", label: "Audi R8 V10 Performance",        category: "Super",   stored: false, active: true,  isFav: true  },
    { plate: "PO-911T", label: "Porsche 911 Turbo S",            category: "Super",   stored: true,  active: false, isFav: false },
    { plate: "ME-C63S", label: "Mercedes-AMG C63 S",             category: "Sport",   stored: true,  active: false, isFav: false },
    { plate: "NI-GTR3", label: "Nissan GT-R Nismo",              category: "Sport",   stored: false, active: false, isFav: false },
    { plate: "FE-488P", label: "Ferrari 488 Pista",              category: "Super",   stored: true,  active: false, isFav: true  },
    { plate: "LB-URUS", label: "Lamborghini Urus S",             category: "SUV",     stored: true,  active: false, isFav: false },
    { plate: "TE-M3PL", label: "Tesla Model 3 Performance",      category: "Elektro", stored: true,  active: false, isFav: false },
    { plate: "TO-SUPR", label: "Toyota GR Supra",                category: "Sport",   stored: true,  active: false, isFav: false },
    { plate: "DO-CHLG", label: "Dodge Challenger Hellcat",       category: "Muscle",  stored: false, active: true,  isFav: false },
    { plate: "FD-MSTG", label: "Ford Mustang GT",                category: "Muscle",  stored: true,  active: false, isFav: false },
  ];
  openUi({
    context: "garage",
    title: "Garage",
    subtitle: "Lunar",
    vehicles: demoVehicles,
    defaultImage: "./assets/img/header-Car.png",
  });
}
