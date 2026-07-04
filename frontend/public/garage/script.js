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

/* Realistisches modernes Sportcoupé — Seitenansicht, ohne Logos. */
const _svgUID = () => "u" + Math.random().toString(36).slice(2, 8);
function buildCarSVG() {
  const b = _svgUID(), g = _svgUID(), s = _svgUID(), r = _svgUID(), hl = _svgUID();
  return `
<svg viewBox="0 0 340 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="#f2f7ff" stop-opacity="0.98"/>
      <stop offset="0.45" stop-color="#a9c1e0" stop-opacity="0.92"/>
      <stop offset="1"    stop-color="#141a29" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0e1524" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#5EE9FF" stop-opacity="0.55"/>
    </linearGradient>
    <radialGradient id="${s}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#000" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${r}" cx="0.5" cy="0.5" r="0.55">
      <stop offset="0"    stop-color="#3a4966"/>
      <stop offset="0.55" stop-color="#141a29"/>
      <stop offset="1"    stop-color="#05070d"/>
    </radialGradient>
    <linearGradient id="${hl}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"    stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5"  stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="1"    stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Bodenschatten -->
  <ellipse cx="170" cy="107" rx="140" ry="5" fill="url(#${s})"/>

  <!-- Karosserie (schlanker Coupé-Umriss) -->
  <path d="M20 92
           C 22 78, 34 72, 52 70
           L 84 66
           C 94 56, 112 46, 138 42
           C 168 38, 200 42, 228 54
           C 248 62, 268 68, 288 72
           C 306 74, 316 82, 318 92
           L 316 96
           C 316 98, 315 99, 313 99
           L 260 99
           C 258 92, 250 86, 240 86
           C 230 86, 222 92, 220 99
           L 120 99
           C 118 92, 110 86, 100 86
           C 90 86, 82 92, 80 99
           L 24 99
           C 22 99, 20 98, 20 96 Z"
        fill="url(#${b})" stroke="rgba(255,255,255,0.14)" stroke-width="0.8"/>

  <!-- Glasfläche / Fenster -->
  <path d="M92 66
           C 104 54, 122 46, 142 44
           C 164 42, 186 46, 206 54
           L 224 66
           L 214 70
           L 100 70 Z"
        fill="url(#${g})" opacity="0.9"/>

  <!-- B-Säule -->
  <path d="M156 46 L 158 70" stroke="rgba(0,0,0,0.4)" stroke-width="0.9"/>
  <!-- Türlinie -->
  <path d="M156 70 L 156 86" stroke="rgba(0,0,0,0.35)" stroke-width="0.7"/>

  <!-- Sicken / Highlight -->
  <path d="M40 80 C 100 74, 220 74, 300 82" stroke="url(#${hl})" stroke-width="0.9" fill="none"/>
  <path d="M56 88 L 300 88" stroke="rgba(94,233,255,0.28)" stroke-width="0.6" stroke-linecap="round"/>

  <!-- Frontscheinwerfer -->
  <path d="M296 78 L 314 82 L 314 86 L 296 86 Z" fill="rgba(255,240,190,0.95)"/>
  <ellipse cx="308" cy="82" rx="4" ry="1.4" fill="#fff" opacity="0.9"/>
  <!-- Kühlergrill -->
  <rect x="284" y="92" width="24" height="4" rx="1" fill="rgba(0,0,0,0.55)"/>

  <!-- Rücklicht -->
  <path d="M20 82 L 40 78 L 40 86 L 20 86 Z" fill="rgba(255,90,105,0.92)"/>
  <rect x="24" y="92" width="18" height="4" rx="1" fill="rgba(0,0,0,0.55)"/>

  <!-- Türgriff -->
  <rect x="120" y="76" width="14" height="1.6" rx="0.8" fill="rgba(0,0,0,0.55)"/>
  <rect x="200" y="76" width="14" height="1.6" rx="0.8" fill="rgba(0,0,0,0.55)"/>

  <!-- Radhäuser -->
  <path d="M76 99 A 24 24 0 0 1 124 99 Z" fill="rgba(0,0,0,0.5)"/>
  <path d="M216 99 A 24 24 0 0 1 264 99 Z" fill="rgba(0,0,0,0.5)"/>

  <!-- Hinterrad -->
  <circle cx="100" cy="99" r="16" fill="url(#${r})" stroke="rgba(255,255,255,0.28)" stroke-width="0.8"/>
  <circle cx="100" cy="99" r="7"  fill="#0a0f1a" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
  <circle cx="100" cy="99" r="1.8" fill="rgba(94,233,255,0.9)"/>
  <g stroke="rgba(220,232,255,0.55)" stroke-width="1" stroke-linecap="round">
    <line x1="100" y1="86"  x2="100" y2="112"/>
    <line x1="87"  y1="99"  x2="113" y2="99"/>
    <line x1="91"  y1="90"  x2="109" y2="108"/>
    <line x1="91"  y1="108" x2="109" y2="90"/>
  </g>

  <!-- Vorderrad -->
  <circle cx="240" cy="99" r="16" fill="url(#${r})" stroke="rgba(255,255,255,0.28)" stroke-width="0.8"/>
  <circle cx="240" cy="99" r="7"  fill="#0a0f1a" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
  <circle cx="240" cy="99" r="1.8" fill="rgba(94,233,255,0.9)"/>
  <g stroke="rgba(220,232,255,0.55)" stroke-width="1" stroke-linecap="round">
    <line x1="240" y1="86"  x2="240" y2="112"/>
    <line x1="227" y1="99"  x2="253" y2="99"/>
    <line x1="231" y1="90"  x2="249" y2="108"/>
    <line x1="231" y1="108" x2="249" y2="90"/>
  </g>
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
      ? `<img class="car-preview" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(v.label)}" onerror="this.style.display='none'" />`
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
  setTimeout(() => $renameInput.trigger("focus"), 50);
}
function closeRenameMenu() {
  state.renamePlate = null;
  $renameInput.val("");
  $editMenu.removeClass("open").hide();
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
  $(".menu-secTitle").text(payload.subtitle || "Lunar · Vehicle Manager");
  $(".prim-Name").text(payload.renameTitle || "Fahrzeug umbenennen");
  $(".menu-desc").text(payload.renameDescription || "Gib deinem Fahrzeug einen neuen Namen — max. 24 Zeichen.");

  $searchInput.val("");
  $container.show();
  closeRenameMenu();
  updateHeaderButtons();
  renderVehicles();
}

/* ----------------- Events ----------------- */
window.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.action === "open") openUi(data);
  if (data.action === "close") closeUi();
});

$(".close-btn").on("click", () => post("close"));

$headerBtns.eq(0).on("click", () => {
  if (state.context === "impound") return;
  state.view = "park-out"; updateHeaderButtons(); renderVehicles();
});
$headerBtns.eq(1).on("click", () => {
  if (state.context === "impound") return;
  state.view = "park-in"; updateHeaderButtons(); renderVehicles();
});
$headerBtns.eq(2).on("click", () => {
  if (state.context === "impound") return;
  state.view = "favourites"; updateHeaderButtons(); renderVehicles();
});

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

  if (state.context === "impound") return post("spawnVehicle", { plate });
  if (state.view === "park-in" || v.active) return post("storeVehicle", { plate });
  post("spawnVehicle", { plate });
});

$(".cancel").on("click", closeRenameMenu);

$(".ready").on("click", () => {
  const name = ($renameInput.val() || "").trim();
  if (!state.renamePlate) return;
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
    subtitle: "Lunar · Vehicle Manager",
    vehicles: demoVehicles,
    defaultImage: "",
  });
}
