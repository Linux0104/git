const resourceName = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'lunar_marketplace';

const state = {
    visible: false,
    payload: null,
    tab: 'browse',
    search: '',
    filter: 'all',
    statsHistory: [],
    create: {
        category: 'item',
        listingType: 'sale',
        selectedItem: '',
        selectedPlate: '',
        quantity: 1,
        durationMinutes: 60,
        title: '',
        description: '',
        advertised: false,
        price: 100,
        minimumBid: 100
    }
};

const appEl = document.getElementById('app');
const browseGridEl = document.getElementById('browseGrid');
const browseEmptyEl = document.getElementById('browseEmpty');
const myGridEl = document.getElementById('myGrid');
const myEmptyEl = document.getElementById('myEmpty');
const marketBadgeEl = document.getElementById('marketBadge');
const marketModeEl = document.getElementById('marketMode');
const walletMiniEl = document.getElementById('walletMini');
const viewTitleEl = document.getElementById('viewTitle');
const modalEl = document.getElementById('modal');
const modalTitleEl = document.getElementById('modalTitle');
const modalEyebrowEl = document.getElementById('modalEyebrow');
const modalBodyEl = document.getElementById('modalBody');
const toastContainerEl = document.getElementById('toastContainer');
const browseFilterEl = document.getElementById('browseFilter');
const earnedSparkEl = document.getElementById('earnedSpark');

/* ============================================================
   SOUND SYSTEM (Web Audio — generated tones, no files needed)
   ============================================================ */
let audioCtx = null;
function ensureAudio() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
}
function beep(freq, duration, type = 'sine', vol = 0.04) {
    ensureAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + duration);
}
const sfx = {
    hover: () => beep(1200, 0.025, 'square', 0.012),
    click: () => beep(880, 0.05, 'square', 0.025),
    swoosh: () => { beep(520, 0.06, 'sine', 0.03); setTimeout(() => beep(880, 0.08, 'sine', 0.03), 40); },
    confirm: () => { beep(660, 0.07, 'sine', 0.04); setTimeout(() => beep(990, 0.12, 'sine', 0.04), 80); },
    alert: () => { beep(220, 0.18, 'sawtooth', 0.05); setTimeout(() => beep(180, 0.18, 'sawtooth', 0.05), 100); },
    error: () => beep(160, 0.25, 'sawtooth', 0.05)
};

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(message, type = 'info') {
    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-exclamation',
        info: 'fa-circle-info',
        warning: 'fa-triangle-exclamation'
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${esc(message)}</span>`;
    toastContainerEl.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, 3200);
}

/* ============================================================
   COUNTDOWN TIMER (auctions)
   ============================================================ */
const countdownTargets = new Map(); // listingId -> targetTimestampMs

function parseExpiresToMs(text) {
    if (!text) return 0;
    const t = String(text).toLowerCase();
    let total = 0;
    const h = t.match(/(\d+)\s*h/);
    const m = t.match(/(\d+)\s*m(?!s)/);
    const s = t.match(/(\d+)\s*s/);
    if (h) total += Number(h[1]) * 3600000;
    if (m) total += Number(m[1]) * 60000;
    if (s) total += Number(s[1]) * 1000;
    return total;
}

function formatRemaining(ms) {
    if (ms <= 0) return '00:00';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function setCountdownTarget(id, expiresText) {
    if (!id || !expiresText) return;
    const key = String(id);
    const ms = parseExpiresToMs(expiresText);
    if (ms <= 0) return;
    // Only refresh target if difference is significant (>= 30s) or unset
    const existing = countdownTargets.get(key);
    const newTarget = Date.now() + ms;
    if (!existing || Math.abs(existing - newTarget) > 30000) {
        countdownTargets.set(key, newTarget);
    }
}

function tickCountdowns() {
    const now = Date.now();
    document.querySelectorAll('[data-countdown]').forEach((el) => {
        const id = el.dataset.countdown;
        const target = countdownTargets.get(id);
        if (!target) return;
        const remaining = target - now;
        el.textContent = formatRemaining(remaining);
        el.classList.toggle('urgent', remaining > 0 && remaining < 5 * 60 * 1000);
        el.classList.toggle('critical', remaining > 0 && remaining < 60 * 1000);
        el.classList.toggle('expired', remaining <= 0);
    });
}
setInterval(tickCountdowns, 1000);

/* ============================================================
   ICONS / IMAGES
   ============================================================ */
function iconForListing(listing) {
    if (listing.is_auction === 1) return 'fa-gavel';
    if (listing.category === 'vehicle') return 'fa-car';
    return 'fa-cube';
}

// Build an image URL for item listings — points to the inventory resource icons folder.
// Supports several backend field names; falls back to a normalised title slug.
function getItemImageUrl(listing) {
    if (!listing || listing.category !== 'item') return null;
    if (listing.image) return String(listing.image);
    if (listing.image_url) return String(listing.image_url);
    const raw = listing.item_name || listing.itemName || listing.name || listing.title || '';
    if (!raw) return null;
    const slug = String(raw)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_\-]/g, '');
    if (!slug) return null;
    return `nui://inventory/web/assets/icons/${slug}.png`;
}

function listingThumbHtml(listing, sizeClass = '') {
    const url = getItemImageUrl(listing);
    const icon = iconForListing(listing);
    if (!url) {
        return `<div class="listing-thumb ${sizeClass} no-image"><i class="fa-solid ${icon}"></i></div>`;
    }
    return `<div class="listing-thumb ${sizeClass}">
        <img src="${esc(url)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('failed'); this.remove();" />
        <i class="fa-solid ${icon} thumb-fallback"></i>
    </div>`;
}

/* ============================================================
   FETCH WRAPPER + Helpers
   ============================================================ */
function post(action, data = {}) {
    return fetch(`https://${resourceName}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data)
    });
}

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function fmtMoney(value) {
    return `$${Number(value || 0).toLocaleString('de-DE')}`;
}

function setVisible(visible) {
    state.visible = visible;
    appEl.classList.toggle('hidden', !visible);
    if (visible) {
        ensureAudio();
        sfx.swoosh();
    }
    if (!visible) closeModal();
}

function currentMarket() {
    return state.payload?.market || null;
}

function ensureCreateDefaults() {
    const market = currentMarket();
    if (!market) return;

    if (!market.allowVehicles) state.create.category = 'item';
    if (!market.allowAuctions) state.create.listingType = 'sale';

    const items = state.payload?.items || [];
    const vehicles = state.payload?.vehicles || [];

    if (state.create.category === 'item') {
        if (!items.find((item) => item.name === state.create.selectedItem)) {
            state.create.selectedItem = items[0]?.name || '';
        }
    } else if (!vehicles.find((vehicle) => vehicle.plate === state.create.selectedPlate)) {
        state.create.selectedPlate = vehicles[0]?.plate || '';
    }
}

function applyPayload(payload, resetTab = false) {
    state.payload = payload || null;
    if (resetTab) {
        state.tab = 'browse';
        state.search = '';
        state.filter = 'all';
    }

    // Track stats history for sparkline
    const earned = Number(payload?.stats?.total_earned || 0);
    const last = state.statsHistory[state.statsHistory.length - 1];
    if (last !== earned) {
        state.statsHistory.push(earned);
        if (state.statsHistory.length > 24) state.statsHistory.shift();
    }

    // Reset countdown targets so they get re-initialised from fresh expires_text
    // (only clear ones not present in new payload)
    const allIds = new Set([
        ...((payload?.listings) || []).map(l => String(l.id)),
        ...((payload?.myListings) || []).map(l => String(l.id))
    ]);
    for (const k of Array.from(countdownTargets.keys())) {
        if (!allIds.has(k)) countdownTargets.delete(k);
    }

    ensureCreateDefaults();
    render();
}

function setTab(tab) {
    if (state.tab === tab) return;
    state.tab = tab;
    sfx.swoosh();
    renderPanels();
    renderNav();
}

function closeModal() {
    if (!modalEl.classList.contains('hidden')) {
        modalEl.classList.add('hidden');
        modalBodyEl.innerHTML = '';
    }
}

function openModal(eyebrow, title, content) {
    modalEyebrowEl.textContent = eyebrow;
    modalTitleEl.textContent = title;
    modalBodyEl.innerHTML = content;
    modalEl.classList.remove('hidden');
    sfx.click();
}

function findListing(id, ownOnly = false) {
    const source = ownOnly ? (state.payload?.myListings || []) : (state.payload?.listings || []);
    return source.find((listing) => Number(listing.id) === Number(id)) || null;
}

function getBrowseListings() {
    const listings = state.payload?.listings || [];
    const search = state.search.trim().toLowerCase();

    return listings.filter((listing) => {
        const matchesSearch =
            search === '' ||
            String(listing.title || '').toLowerCase().includes(search) ||
            String(listing.seller_name || '').toLowerCase().includes(search);

        let matchesFilter = true;
        if (state.filter === 'item') {
            matchesFilter = listing.category === 'item' && listing.is_auction !== 1;
        } else if (state.filter === 'vehicle') {
            matchesFilter = listing.category === 'vehicle' && listing.is_auction !== 1;
        } else if (state.filter === 'auction') {
            matchesFilter = listing.is_auction === 1;
        } else if (state.filter === 'advertised') {
            matchesFilter = listing.advertised === 1;
        }

        return matchesSearch && matchesFilter;
    });
}

function listingCard(listing, ownOnly = false) {
    const isAuction = listing.is_auction === 1;
    const isAdvertised = listing.advertised === 1;
    const kindClass = isAuction ? 'auction' : (listing.category === 'vehicle' ? 'vehicle' : 'item');
    const cardClasses = ['listing-card'];
    if (isAdvertised) cardClasses.push('advertised');
    if (isAuction) cardClasses.push('is-auction');

    const badges = [];
    badges.push(`<span class="badge ${kindClass}">${esc(listing.kind)}</span>`);
    if (ownOnly) badges.push(`<span class="badge status">${esc(listing.status_label)}</span>`);
    if (isAdvertised) badges.push('<span class="badge ad"><i class="fa-solid fa-bolt"></i> Werbung</span>');

    // Auction countdown setup
    let timeMarkup = `<span><i class="fa-regular fa-clock"></i> ${esc(listing.expires_text || 'unbekannt')}</span>`;
    if (isAuction && listing.status === 'active') {
        setCountdownTarget(listing.id, listing.expires_text);
        const initialMs = (countdownTargets.get(String(listing.id)) || 0) - Date.now();
        const initialText = initialMs > 0 ? formatRemaining(initialMs) : (listing.expires_text || '00:00');
        timeMarkup = `<span class="countdown-wrap"><i class="fa-solid fa-stopwatch"></i> <span class="countdown" data-countdown="${listing.id}">${esc(initialText)}</span></span>`;
    }

    const buttonLabel = ownOnly ? 'Verwalten' : 'Details';
    const action = ownOnly ? 'open-my' : 'open-browse';
    const thumbHtml = listingThumbHtml(listing, 'thumb-card');

    return `
        <article class="${cardClasses.join(' ')}">
            <div class="listing-head">
                <div class="listing-badges">${badges.join('')}</div>
                <div class="listing-price">${esc(listing.price_text)}</div>
            </div>
            <div class="listing-title-row">
                ${thumbHtml}
                <h3>${esc(listing.title)}</h3>
            </div>
            <div class="listing-copy">${esc(listing.action_hint || '')}</div>
            <p class="listing-description">${esc(listing.description || 'Keine Beschreibung hinterlegt.')}</p>
            <div class="listing-meta">
                <span><i class="fa-solid fa-user"></i> ${esc(listing.seller_name || 'Unbekannt')}</span>
                ${timeMarkup}
            </div>
            <div class="listing-actions">
                <button class="mini-btn primary" data-action="${action}" data-id="${listing.id}">${buttonLabel} <i class="fa-solid fa-arrow-right"></i></button>
            </div>
        </article>
    `;
}

function renderBrowse() {
    const listings = getBrowseListings();
    browseGridEl.innerHTML = listings.map((listing) => listingCard(listing, false)).join('');
    browseEmptyEl.classList.toggle('hidden', listings.length > 0);
    updateFilterCounts();
}

function updateFilterCounts() {
    const listings = state.payload?.listings || [];
    const counts = {
        all: listings.length,
        item: listings.filter(l => l.category === 'item' && l.is_auction !== 1).length,
        vehicle: listings.filter(l => l.category === 'vehicle' && l.is_auction !== 1).length,
        auction: listings.filter(l => l.is_auction === 1).length,
        advertised: listings.filter(l => l.advertised === 1).length
    };
    Array.from(browseFilterEl.options).forEach((opt) => {
        const base = opt.dataset.base || opt.value;
        opt.textContent = `${base} (${counts[opt.value] || 0})`;
    });
}

function renderMyListings() {
    const listings = state.payload?.myListings || [];
    myGridEl.innerHTML = listings.map((listing) => listingCard(listing, true)).join('');
    myEmptyEl.classList.toggle('hidden', listings.length > 0);
}

function selectedInventoryEntry() {
    if (!state.payload) return null;
    if (state.create.category === 'item') {
        return (state.payload.items || []).find((item) => item.name === state.create.selectedItem) || null;
    }
    return (state.payload.vehicles || []).find((vehicle) => vehicle.plate === state.create.selectedPlate) || null;
}

function updateCreateDefaultsFromSelection(forceTitle = false) {
    const selected = selectedInventoryEntry();
    if (!selected) return;

    if (state.create.category === 'item') {
        if (forceTitle || !state.create.title) state.create.title = selected.label || selected.name;
        if (!state.create.quantity || state.create.quantity < 1) state.create.quantity = 1;
    } else if (forceTitle || !state.create.title) {
        state.create.title = selected.display || selected.plate;
    }
}

function renderCreate() {
    const market = currentMarket();
    const items = state.payload?.items || [];
    const vehicles = state.payload?.vehicles || [];

    ensureCreateDefaults();

    document.querySelectorAll('#categorySwitch .segment').forEach((button) => {
        const category = button.dataset.category;
        const disabled = category === 'vehicle' && !market.allowVehicles;
        button.classList.toggle('active', state.create.category === category);
        button.classList.toggle('disabled', disabled);
    });

    document.querySelectorAll('#typeSwitch .segment').forEach((button) => {
        const type = button.dataset.type;
        const disabled = type === 'auction' && !market.allowAuctions;
        button.classList.toggle('active', state.create.listingType === type);
        button.classList.toggle('disabled', disabled);
    });

    const inventoryLabel = document.getElementById('inventoryLabel');
    const inventorySelect = document.getElementById('inventorySelect');
    const inventoryHint = document.getElementById('inventoryHint');
    const quantityField = document.getElementById('quantityField');
    const durationField = document.getElementById('durationField');
    const priceLabel = document.getElementById('priceLabel');
    const quantityInput = document.getElementById('quantityInput');
    const durationInput = document.getElementById('durationInput');
    const titleInput = document.getElementById('titleInput');
    const descriptionInput = document.getElementById('descriptionInput');
    const priceInput = document.getElementById('priceInput');
    const advertisedInput = document.getElementById('advertisedInput');
    const advertisedLabel = document.getElementById('advertisedLabel');
    const createSummary = document.getElementById('createSummary');

    const isItem = state.create.category === 'item';
    const source = isItem ? items : vehicles;
    const selectedValue = isItem ? state.create.selectedItem : state.create.selectedPlate;
    const optionValueKey = isItem ? 'name' : 'plate';
    const optionLabelKey = isItem ? 'label' : 'display';

    inventoryLabel.textContent = isItem ? 'Inventar Auswahl' : 'Garage Auswahl';
    inventorySelect.innerHTML = source.map((entry) => `<option value="${esc(entry[optionValueKey])}">${esc(entry[optionLabelKey])}</option>`).join('');
    inventorySelect.value = selectedValue;
    inventorySelect.disabled = source.length === 0;

    quantityField.classList.toggle('hidden', !isItem);
    durationField.classList.toggle('hidden', state.create.listingType !== 'auction');
    priceLabel.textContent = state.create.listingType === 'auction' ? 'Mindestgebot' : (isItem ? 'Preis pro Stueck' : 'Verkaufspreis');
    quantityInput.value = state.create.quantity;
    durationInput.value = state.create.durationMinutes;
    titleInput.value = state.create.title;
    descriptionInput.value = state.create.description;
    priceInput.value = state.create.listingType === 'auction' ? state.create.minimumBid : state.create.price;
    advertisedInput.checked = state.create.advertised === true;
    advertisedInput.disabled = !market.allowAdvertising;
    advertisedLabel.textContent = market.allowAdvertising && market.adFee > 0
        ? `Als Werbung hervorheben (${fmtMoney(market.adFee)})`
        : 'Als Werbung hervorheben';

    const selected = selectedInventoryEntry();
    if (!selected) {
        inventoryHint.textContent = isItem
            ? 'Keine verfuegbaren Items fuer diesen Markt.'
            : 'Keine verfuegbaren Fahrzeuge fuer diesen Markt.';
    } else if (isItem) {
        inventoryHint.textContent = `Verfuegbar: ${selected.count}x ${selected.label}`;
    } else {
        inventoryHint.textContent = `Kennzeichen: ${selected.plate} | ${selected.display}`;
    }

    createSummary.textContent = state.create.listingType === 'auction'
        ? 'Auktionen reservieren Gebote sofort und erstatten ueberbotene Spieler automatisch.'
        : 'Festpreisangebote koennen direkt gekauft werden.';
}

/* ============================================================
   SPARKLINE (SVG) — Verlauf "Gesamt verdient"
   ============================================================ */
function renderSparkline() {
    if (!earnedSparkEl) return;
    const data = state.statsHistory.slice();
    if (data.length < 2) {
        earnedSparkEl.innerHTML = '';
        return;
    }
    const w = 120, h = 40, pad = 2;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = (max - min) || 1;
    const step = (w - pad * 2) / (data.length - 1);
    const points = data.map((v, i) => {
        const x = pad + i * step;
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const path = `M ${points.join(' L ')}`;
    const areaPath = `${path} L ${pad + (data.length - 1) * step},${h} L ${pad},${h} Z`;
    earnedSparkEl.innerHTML = `
        <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#00fff0" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#00fff0" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#sparkGrad)"/>
        <path d="${path}" fill="none" stroke="#00fff0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(0,255,240,0.6));"/>
    `;
}

function renderWallet() {
    const stats = state.payload?.stats || {};
    const total = Number(stats.pending_payout || 0) + Number(stats.pending_refund || 0);

    document.getElementById('statSales').textContent = Number(stats.sales_count || 0).toLocaleString('de-DE');
    document.getElementById('statEarned').textContent = fmtMoney(stats.total_earned || 0);
    document.getElementById('statPayout').textContent = fmtMoney(stats.pending_payout || 0);
    document.getElementById('statRefund').textContent = fmtMoney(stats.pending_refund || 0);
    document.getElementById('walletTotal').textContent = fmtMoney(total);
    walletMiniEl.textContent = fmtMoney(total);
    document.getElementById('claimWalletBtn').disabled = total <= 0;
    renderSparkline();
}

function renderNav() {
    document.querySelectorAll('.nav-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === state.tab);
    });
}

function renderPanels() {
    document.querySelectorAll('.panel').forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.panel !== state.tab);
    });
}

function renderHeader() {
    const market = currentMarket();
    if (!market) return;
    marketBadgeEl.textContent = market.label;
    marketModeEl.textContent = 'Marketplace';
    viewTitleEl.textContent = market.label;
}

function render() {
    if (!state.payload) return;
    renderHeader();
    renderNav();
    renderPanels();
    renderBrowse();
    renderCreate();
    renderMyListings();
    renderWallet();
}

function openListingModal(listing, ownOnly = false) {
    if (!listing) return;

    const details = [
        { label: 'Kategorie', value: listing.kind, icon: 'fa-tag' },
        { label: 'Verkaeufer', value: listing.seller_name || 'Unbekannt', icon: 'fa-user' },
        { label: 'Laufzeit', value: listing.expires_text || 'unbekannt', icon: 'fa-clock' },
        { label: 'Preis', value: listing.price_text || '-', icon: 'fa-dollar-sign' }
    ];
    if (ownOnly) details.push({ label: 'Status', value: listing.status_label || listing.status || 'Unbekannt', icon: 'fa-circle-info' });

    let actionHtml = '';

    if (listing.status === 'expired' && ownOnly) {
        actionHtml = `<div class="modal-actions"><button class="primary-btn" data-modal-action="claim" data-id="${listing.id}"><i class="fa-solid fa-rotate-left"></i> Zurueckholen</button></div>`;
    } else if (listing.status === 'active' && ownOnly) {
        actionHtml = `<div class="modal-actions"><button class="ghost-btn" data-modal-action="edit" data-id="${listing.id}"><i class="fa-solid fa-pen"></i> Bearbeiten</button><button class="danger-btn" data-modal-action="delete" data-id="${listing.id}"><i class="fa-solid fa-trash"></i> Loeschen</button></div>`;
    } else if (listing.status === 'active' && listing.is_auction === 1 && !ownOnly) {
        actionHtml = `
            <div class="modal-input-row">
                <input id="modalBidInput" class="input" type="number" min="${listing.next_bid || listing.minimum_bid || 1}" value="${listing.next_bid || listing.minimum_bid || 100}">
                <button class="primary-btn" data-modal-action="bid" data-id="${listing.id}"><i class="fa-solid fa-gavel"></i> Gebot senden</button>
            </div>
            <p class="modal-subtext">Gebote werden sofort reserviert und bei Ueberbietung automatisch erstattet.</p>
        `;
    } else if (listing.status === 'active' && listing.is_auction !== 1 && !ownOnly) {
        if (listing.category === 'item') {
            actionHtml = `
                <div class="modal-input-row">
                    <input id="modalBuyAmount" class="input" type="number" min="1" max="${listing.quantity || 1}" value="1">
                    <button class="primary-btn" data-modal-action="buy" data-id="${listing.id}"><i class="fa-solid fa-cart-shopping"></i> Kaufen</button>
                </div>
            `;
        } else {
            actionHtml = `<div class="modal-actions"><button class="primary-btn" data-modal-action="buy" data-id="${listing.id}"><i class="fa-solid fa-key"></i> Fahrzeug kaufen</button></div>`;
        }
    }

    openModal(
        ownOnly ? 'Mein Angebot' : 'Angebotsdetails',
        listing.title,
        `
            <div class="modal-hero">
                ${listingThumbHtml(listing, 'thumb-modal')}
                <div class="modal-hero-text">
                    <div class="modal-hero-kind">${esc(listing.kind || '')}</div>
                    <div class="modal-hero-price">${esc(listing.price_text || '-')}</div>
                </div>
            </div>
            <div class="detail-grid">
                ${details.map((d) => `
                    <div class="detail-card">
                        <span><i class="fa-solid ${d.icon}"></i> ${esc(d.label)}</span>
                        <strong>${esc(d.value)}</strong>
                    </div>
                `).join('')}
            </div>
            <p class="modal-subtext">${esc(listing.description || 'Keine Beschreibung hinterlegt.')}</p>
            ${actionHtml}
        `
    );
}

function openEditModal(listing) {
    if (!listing) return;
    openModal(
        'Bearbeiten',
        listing.title,
        `
            <div class="form-grid">
                <div class="field wide"><label>Titel</label><input id="editTitle" class="input" type="text" maxlength="48" value="${esc(listing.title || '')}"></div>
                <div class="field wide"><label>Beschreibung</label><textarea id="editDescription" class="input textarea" maxlength="180">${esc(listing.description || '')}</textarea></div>
                <div class="field"><label>${listing.is_auction === 1 ? 'Mindestgebot' : 'Preis'}</label><input id="editPrice" class="input" type="number" min="1" value="${listing.is_auction === 1 ? (listing.minimum_bid || 0) : (listing.price_per_unit || listing.price || 0)}"></div>
                <div class="field checkbox-field"><label class="checkbox"><input id="editAdvertised" type="checkbox" ${listing.advertised === 1 ? 'checked' : ''}><span>Werbung aktivieren</span></label></div>
            </div>
            <div class="modal-actions">
                <button class="primary-btn" data-modal-action="save-edit" data-id="${listing.id}" data-auction="${listing.is_auction === 1 ? '1' : '0'}"><i class="fa-solid fa-floppy-disk"></i> Speichern</button>
            </div>
        `
    );
}

async function submitCreate() {
    const market = currentMarket();
    if (!market) return;
    const selected = selectedInventoryEntry();
    if (!selected) { sfx.error(); showToast('Keine Inventar-Auswahl verfügbar.', 'error'); return; }
    if (!state.create.title.trim()) { sfx.error(); showToast('Bitte einen Titel eingeben.', 'warning'); return; }

    const payload = {
        category: state.create.category,
        title: state.create.title.trim(),
        description: state.create.description.trim(),
        advertised: state.create.advertised,
        isAuction: state.create.listingType === 'auction'
    };

    if (state.create.category === 'item') {
        payload.itemName = selected.name;
        payload.itemLabel = selected.label;
        payload.quantity = Number(state.create.quantity || 1);
        payload.pricePerUnit = Number(state.create.price || 0);
        payload.minimumBid = Number(state.create.minimumBid || 0);
    } else {
        payload.plate = selected.plate;
        payload.price = Number(state.create.price || 0);
        payload.minimumBid = Number(state.create.minimumBid || 0);
    }

    payload.durationMinutes = Number(state.create.durationMinutes || 0);

    await post('createListing', payload);
    sfx.confirm();
    showToast(state.create.listingType === 'auction' ? 'Auktion erstellt!' : 'Angebot erstellt!', 'success');

    state.create.description = '';
    state.create.advertised = false;
    closeModal();
}

/* ============================================================
   EVENTS
   ============================================================ */
window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.action === 'open') {
        setVisible(true);
        applyPayload(data.payload, true);
    } else if (data.action === 'refresh') {
        applyPayload(data.payload, false);
    } else if (data.action === 'close') {
        setVisible(false);
    } else if (data.action === 'notify' && data.message) {
        // optional: server can push notifications
        showToast(data.message, data.type || 'info');
        if (data.type === 'error') sfx.error();
        else if (data.type === 'warning') sfx.alert();
        else sfx.confirm();
    }
});

document.addEventListener('keydown', async (event) => {
    if (event.key !== 'Escape') return;
    if (!modalEl.classList.contains('hidden')) { closeModal(); return; }
    await post('close');
    setVisible(false);
});

document.getElementById('closeBtn').addEventListener('click', async () => {
    sfx.click();
    await post('close');
    setVisible(false);
});

document.getElementById('modalClose').addEventListener('click', () => { sfx.click(); closeModal(); });
modalEl.addEventListener('click', (event) => { if (event.target === modalEl) closeModal(); });

document.getElementById('refreshBtn').addEventListener('click', async () => {
    sfx.click();
    await post('refresh');
    showToast('Aktualisiert', 'info');
});

document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => { sfx.click(); setTab(button.dataset.tab); });
});

// Empty state CTA tab-switch buttons
document.body.addEventListener('click', (event) => {
    const tabSwitch = event.target.closest('[data-tab-switch]');
    if (tabSwitch) { sfx.click(); setTab(tabSwitch.dataset.tabSwitch); }
});

document.getElementById('searchInput').addEventListener('input', (event) => {
    state.search = event.target.value || '';
    renderBrowse();
});

document.getElementById('browseFilter').addEventListener('change', (event) => {
    state.filter = event.target.value || 'all';
    sfx.click();
    renderBrowse();
});

document.getElementById('categorySwitch').addEventListener('click', (event) => {
    const button = event.target.closest('.segment');
    if (!button || button.classList.contains('disabled')) return;
    sfx.click();
    state.create.category = button.dataset.category;
    updateCreateDefaultsFromSelection(true);
    renderCreate();
});

document.getElementById('typeSwitch').addEventListener('click', (event) => {
    const button = event.target.closest('.segment');
    if (!button || button.classList.contains('disabled')) return;
    sfx.click();
    state.create.listingType = button.dataset.type;
    if (state.create.listingType === 'auction') {
        state.create.minimumBid = state.create.minimumBid || Math.max(100, Number(state.create.price || 0));
    }
    renderCreate();
});

document.getElementById('inventorySelect').addEventListener('change', (event) => {
    if (state.create.category === 'item') state.create.selectedItem = event.target.value;
    else state.create.selectedPlate = event.target.value;
    updateCreateDefaultsFromSelection(true);
    renderCreate();
});

document.getElementById('quantityInput').addEventListener('input', (event) => { state.create.quantity = Number(event.target.value || 1); });
document.getElementById('durationInput').addEventListener('input', (event) => { state.create.durationMinutes = Number(event.target.value || 60); });
document.getElementById('titleInput').addEventListener('input', (event) => { state.create.title = event.target.value || ''; });
document.getElementById('descriptionInput').addEventListener('input', (event) => { state.create.description = event.target.value || ''; });
document.getElementById('priceInput').addEventListener('input', (event) => {
    const value = Number(event.target.value || 0);
    if (state.create.listingType === 'auction') state.create.minimumBid = value;
    else state.create.price = value;
});
document.getElementById('advertisedInput').addEventListener('change', (event) => { state.create.advertised = event.target.checked; });
document.getElementById('submitCreate').addEventListener('click', submitCreate);
document.getElementById('claimWalletBtn').addEventListener('click', async () => {
    sfx.confirm();
    await post('claimWallet');
    showToast('Wallet abgeholt!', 'success');
});

// Card hover sound (delegated, throttled)
let lastHoverSfx = 0;
document.body.addEventListener('mouseover', (event) => {
    const card = event.target.closest('.listing-card');
    if (!card || card._sfxFired) return;
    const now = performance.now();
    if (now - lastHoverSfx < 60) return;
    lastHoverSfx = now;
    sfx.hover();
});

// Card / modal action handler
document.body.addEventListener('click', async (event) => {
    const actionButton = event.target.closest('[data-action], [data-modal-action]');
    if (!actionButton) return;

    if (actionButton.dataset.action) {
        const action = actionButton.dataset.action;
        const id = Number(actionButton.dataset.id);
        sfx.click();
        if (action === 'open-browse') openListingModal(findListing(id, false), false);
        else if (action === 'open-my') openListingModal(findListing(id, true), true);
        return;
    }

    const modalAction = actionButton.dataset.modalAction;
    const id = Number(actionButton.dataset.id);
    const listing = findListing(id, true) || findListing(id, false);
    if (!listing) return;

    if (modalAction === 'edit') {
        sfx.click();
        openEditModal(listing);
    } else if (modalAction === 'delete') {
        sfx.alert();
        await post('deleteListing', { id });
        showToast('Angebot gelöscht', 'warning');
        closeModal();
    } else if (modalAction === 'claim') {
        sfx.confirm();
        await post('claimExpired', { id });
        showToast('Angebot zurückgeholt', 'success');
        closeModal();
    } else if (modalAction === 'buy') {
        const amountInput = document.getElementById('modalBuyAmount');
        const amount = amountInput ? Number(amountInput.value || 1) : 1;
        sfx.confirm();
        await post('buyListing', { listingId: id, amount });
        showToast('Kauf abgeschlossen!', 'success');
        closeModal();
    } else if (modalAction === 'bid') {
        const bidInput = document.getElementById('modalBidInput');
        const amount = bidInput ? Number(bidInput.value || 0) : 0;
        sfx.confirm();
        await post('bidListing', { listingId: id, amount });
        showToast('Gebot platziert!', 'success');
        closeModal();
    } else if (modalAction === 'save-edit') {
        const isAuction = actionButton.dataset.auction === '1';
        sfx.confirm();
        await post('updateListing', {
            id,
            title: document.getElementById('editTitle')?.value || '',
            description: document.getElementById('editDescription')?.value || '',
            advertised: document.getElementById('editAdvertised')?.checked === true,
            minimumBid: isAuction ? Number(document.getElementById('editPrice')?.value || 0) : 0,
            pricePerUnit: isAuction ? 0 : Number(document.getElementById('editPrice')?.value || 0)
        });
        showToast('Änderungen gespeichert', 'success');
        closeModal();
    }
});
