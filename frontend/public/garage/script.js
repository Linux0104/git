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

/* SVG generic car silhouette used when no preview image is provided. */
const CAR_SVG = `
<svg viewBox="0 0 141 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="carg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#5EE9FF" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <path fill="url(#carg)" d="M70.6 0.1c-7.3.6-12.3 1.8-16.9 4-2 1-3.7 2-7.4 4.6-4.5 3.1-6.3 4-9.2 4.9-2.9.8-5.2 1.1-11.8 1.8-2.4.2-5.1.5-6.1.6C6.9 17.5 1.8 21.3.3 30.2c-.5 2.9-.4 8.4.2 9.7.3.7.7 1.1 1.4 1.5.5.3.7.3 5.1.3l4.6.1-.1-.6c-.4-2.3-.2-4.6.5-6.8 1.5-4.5 5.2-7.8 9.7-8.8 5.9-1.2 11.8 1.7 14.4 7.3 1.1 2.4 1.5 5 1.2 7.8v.9h32.9c29.1 0 32.8-.1 32.8-.3 0-.1-.1-1.1-.1-2.2-.1-2.3.1-3.5.8-5.4 1.5-3.9 4.8-7 8.9-8.1 1-.3 1.5-.3 3.4-.3 2 0 2.4 0 3.5.4 4.6 1.4 7.9 4.9 9.1 9.6.3 1.3.4 4 .2 5.5l-.1.8 1.1-.1c4-.3 6.5-1.3 8.5-3.5 1.7-1.8 2.3-3.3 2.6-7.4.4-5.1-.4-13.7-1.5-15.3-.7-1-1.5-1.4-3.4-1.6-5.1-.6-8.5-1.6-14.7-4.1-1.7-.7-4.7-2-6.7-2.8C97.3 3 89.9 1.2 78.9.2 76.6 0 65.2 0 63.2.1z"/>
</svg>`;

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

    const carImg = v.image
      ? `<img class="car-preview" src="${escapeHtml(v.image)}" alt="${escapeHtml(v.label)}" onerror="this.remove()" />`
      : (state.defaultImage
          ? `<img class="car-preview" src="${escapeHtml(state.defaultImage)}" alt="${escapeHtml(v.label)}" onerror="this.remove()" />`
          : "");

    $carList.append(`
      <div class="carlist-item" data-plate="${escapeHtml(v.plate)}" data-testid="car-${escapeHtml(v.plate)}">
        <div class="top-carCtn">
          <div class="plate"><p class="plate-value">${escapeHtml(v.plate)}</p></div>
          <div class="car-actions">${actionsHtml}</div>
        </div>
        <div class="car-visual">
          ${carImg || CAR_SVG}
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
  state.defaultImage = payload.defaultImage || "./assets/img/header-Car.png";
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
