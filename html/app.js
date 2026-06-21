const resourceName = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'lunar_marketplace';

const state = {
    visible: false,
    payload: null,
    tab: 'browse',
    search: '',
    filter: 'all',
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
const marketDescriptionEl = document.getElementById('marketDescription');
const walletMiniEl = document.getElementById('walletMini');
const viewTitleEl = document.getElementById('viewTitle');
const modalEl = document.getElementById('modal');
const modalTitleEl = document.getElementById('modalTitle');
const modalEyebrowEl = document.getElementById('modalEyebrow');
const modalBodyEl = document.getElementById('modalBody');

function post(action, data = {}) {
    return fetch(`https://${resourceName}/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
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
    if (!visible) {
        closeModal();
    }
}

function currentMarket() {
    return state.payload?.market || null;
}

function ensureCreateDefaults() {
    const market = currentMarket();
    if (!market) {
        return;
    }

    if (!market.allowVehicles) {
        state.create.category = 'item';
    }

    if (!market.allowAuctions) {
        state.create.listingType = 'sale';
    }

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

    ensureCreateDefaults();
    render();
}

function setTab(tab) {
    state.tab = tab;
    renderPanels();
    renderNav();
}

function closeModal() {
    modalEl.classList.add('hidden');
    modalBodyEl.innerHTML = '';
}

function openModal(eyebrow, title, content) {
    modalEyebrowEl.textContent = eyebrow;
    modalTitleEl.textContent = title;
    modalBodyEl.innerHTML = content;
    modalEl.classList.remove('hidden');
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
    const badges = [];
    const kindClass = listing.is_auction === 1 ? 'auction' : (listing.category === 'vehicle' ? 'vehicle' : 'item');
    badges.push(`<span class="badge ${kindClass}">${esc(listing.kind)}</span>`);

    if (ownOnly) {
        badges.push(`<span class="badge status">${esc(listing.status_label)}</span>`);
    }

    if (listing.advertised === 1) {
        badges.push('<span class="badge auction">Werbung</span>');
    }

    const buttonLabel = ownOnly ? 'Verwalten' : 'Details';
    const action = ownOnly ? 'open-my' : 'open-browse';

    return `
        <article class="listing-card">
            <div class="listing-head">
                <div class="listing-badges">${badges.join('')}</div>
                <div class="listing-price">${esc(listing.price_text)}</div>
            </div>
            <h3>${esc(listing.title)}</h3>
            <div class="listing-copy">${esc(listing.action_hint || '')}</div>
            <p class="listing-description">${esc(listing.description || 'Keine Beschreibung hinterlegt.')}</p>
            <div class="listing-meta">
                <span>Verkaeufer: ${esc(listing.seller_name || 'Unbekannt')}</span>
                <span>Laufzeit: ${esc(listing.expires_text || 'unbekannt')}</span>
            </div>
            <div class="listing-actions">
                <button class="mini-btn primary" data-action="${action}" data-id="${listing.id}">${buttonLabel}</button>
            </div>
        </article>
    `;
}

function renderBrowse() {
    const listings = getBrowseListings();
    browseGridEl.innerHTML = listings.map((listing) => listingCard(listing, false)).join('');
    browseEmptyEl.classList.toggle('hidden', listings.length > 0);
}

function renderMyListings() {
    const listings = state.payload?.myListings || [];
    myGridEl.innerHTML = listings.map((listing) => listingCard(listing, true)).join('');
    myEmptyEl.classList.toggle('hidden', listings.length > 0);
}

function selectedInventoryEntry() {
    if (!state.payload) {
        return null;
    }

    if (state.create.category === 'item') {
        return (state.payload.items || []).find((item) => item.name === state.create.selectedItem) || null;
    }

    return (state.payload.vehicles || []).find((vehicle) => vehicle.plate === state.create.selectedPlate) || null;
}

function updateCreateDefaultsFromSelection(forceTitle = false) {
    const selected = selectedInventoryEntry();
    if (!selected) {
        return;
    }

    if (state.create.category === 'item') {
        if (forceTitle || !state.create.title) {
            state.create.title = selected.label || selected.name;
        }

        if (!state.create.quantity || state.create.quantity < 1) {
            state.create.quantity = 1;
        }
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
    if (!market) {
        return;
    }

    marketBadgeEl.textContent = market.label;
    marketModeEl.textContent = 'Marketplace';
    marketDescriptionEl.textContent = 'Spieler handeln Items, Fahrzeuge und Auktionen in Echtzeit.';
    viewTitleEl.textContent = market.label;
}

function render() {
    if (!state.payload) {
        return;
    }

    renderHeader();
    renderNav();
    renderPanels();
    renderBrowse();
    renderCreate();
    renderMyListings();
    renderWallet();
}

function openListingModal(listing, ownOnly = false) {
    if (!listing) {
        return;
    }

    const details = [
        { label: 'Kategorie', value: listing.kind },
        { label: 'Verkaeufer', value: listing.seller_name || 'Unbekannt' },
        { label: 'Laufzeit', value: listing.expires_text || 'unbekannt' },
        { label: 'Preis', value: listing.price_text || '-' }
    ];

    if (ownOnly) {
        details.push({ label: 'Status', value: listing.status_label || listing.status || 'Unbekannt' });
    }

    let actionHtml = '';

    if (listing.status === 'expired' && ownOnly) {
        actionHtml = `
            <div class="modal-actions">
                <button class="primary-btn" data-modal-action="claim" data-id="${listing.id}">Zurueckholen</button>
            </div>
        `;
    } else if (listing.status === 'active' && ownOnly) {
        actionHtml = `
            <div class="modal-actions">
                <button class="ghost-btn" data-modal-action="edit" data-id="${listing.id}">Bearbeiten</button>
                <button class="danger-btn" data-modal-action="delete" data-id="${listing.id}">Loeschen</button>
            </div>
        `;
    } else if (listing.status === 'active' && listing.is_auction === 1 && !ownOnly) {
        actionHtml = `
            <div class="modal-input-row">
                <input id="modalBidInput" class="input" type="number" min="${listing.next_bid || listing.minimum_bid || 1}" value="${listing.next_bid || listing.minimum_bid || 100}">
                <button class="primary-btn" data-modal-action="bid" data-id="${listing.id}">Gebot senden</button>
            </div>
            <p class="modal-subtext">Gebote werden sofort reserviert und bei Ueberbietung automatisch erstattet.</p>
        `;
    } else if (listing.status === 'active' && listing.is_auction !== 1 && !ownOnly) {
        if (listing.category === 'item') {
            actionHtml = `
                <div class="modal-input-row">
                    <input id="modalBuyAmount" class="input" type="number" min="1" max="${listing.quantity || 1}" value="1">
                    <button class="primary-btn" data-modal-action="buy" data-id="${listing.id}">Kaufen</button>
                </div>
            `;
        } else {
            actionHtml = `
                <div class="modal-actions">
                    <button class="primary-btn" data-modal-action="buy" data-id="${listing.id}">Fahrzeug kaufen</button>
                </div>
            `;
        }
    }

    openModal(
        ownOnly ? 'Mein Angebot' : 'Angebotsdetails',
        listing.title,
        `
            <div class="detail-grid">
                ${details.map((detail) => `
                    <div class="detail-card">
                        <span>${esc(detail.label)}</span>
                        <strong>${esc(detail.value)}</strong>
                    </div>
                `).join('')}
            </div>
            <p class="modal-subtext">${esc(listing.description || 'Keine Beschreibung hinterlegt.')}</p>
            ${actionHtml}
        `
    );
}

function openEditModal(listing) {
    if (!listing) {
        return;
    }

    openModal(
        'Bearbeiten',
        listing.title,
        `
            <div class="form-grid">
                <div class="field wide">
                    <label>Titel</label>
                    <input id="editTitle" class="input" type="text" maxlength="48" value="${esc(listing.title || '')}">
                </div>
                <div class="field wide">
                    <label>Beschreibung</label>
                    <textarea id="editDescription" class="input textarea" maxlength="180">${esc(listing.description || '')}</textarea>
                </div>
                <div class="field">
                    <label>${listing.is_auction === 1 ? 'Mindestgebot' : 'Preis'}</label>
                    <input id="editPrice" class="input" type="number" min="1" value="${listing.is_auction === 1 ? (listing.minimum_bid || 0) : (listing.price_per_unit || listing.price || 0)}">
                </div>
                <div class="field checkbox-field">
                    <label class="checkbox">
                        <input id="editAdvertised" type="checkbox" ${listing.advertised === 1 ? 'checked' : ''}>
                        <span>Werbung aktivieren</span>
                    </label>
                </div>
            </div>
            <div class="modal-actions">
                <button class="primary-btn" data-modal-action="save-edit" data-id="${listing.id}" data-auction="${listing.is_auction === 1 ? '1' : '0'}">Speichern</button>
            </div>
        `
    );
}

async function submitCreate() {
    const market = currentMarket();
    if (!market) {
        return;
    }

    const selected = selectedInventoryEntry();
    if (!selected) {
        return;
    }

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

    state.create.description = '';
    state.create.advertised = false;
    closeModal();
}

window.addEventListener('message', (event) => {
    const data = event.data || {};

    if (data.action === 'open') {
        setVisible(true);
        applyPayload(data.payload, true);
    } else if (data.action === 'refresh') {
        applyPayload(data.payload, false);
    } else if (data.action === 'close') {
        setVisible(false);
    }
});

document.addEventListener('keydown', async (event) => {
    if (event.key !== 'Escape') {
        return;
    }

    if (!modalEl.classList.contains('hidden')) {
        closeModal();
        return;
    }

    await post('close');
    setVisible(false);
});

document.getElementById('closeBtn').addEventListener('click', async () => {
    await post('close');
    setVisible(false);
});

document.getElementById('modalClose').addEventListener('click', closeModal);
modalEl.addEventListener('click', (event) => {
    if (event.target === modalEl) {
        closeModal();
    }
});

document.getElementById('refreshBtn').addEventListener('click', async () => {
    await post('refresh');
});

document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => setTab(button.dataset.tab));
});

document.getElementById('searchInput').addEventListener('input', (event) => {
    state.search = event.target.value || '';
    renderBrowse();
});

document.getElementById('browseFilter').addEventListener('change', (event) => {
    state.filter = event.target.value || 'all';
    renderBrowse();
});

document.getElementById('categorySwitch').addEventListener('click', (event) => {
    const button = event.target.closest('.segment');
    if (!button || button.classList.contains('disabled')) {
        return;
    }

    state.create.category = button.dataset.category;
    updateCreateDefaultsFromSelection(true);
    renderCreate();
});

document.getElementById('typeSwitch').addEventListener('click', (event) => {
    const button = event.target.closest('.segment');
    if (!button || button.classList.contains('disabled')) {
        return;
    }

    state.create.listingType = button.dataset.type;
    if (state.create.listingType === 'auction') {
        state.create.minimumBid = state.create.minimumBid || Math.max(100, Number(state.create.price || 0));
    }
    renderCreate();
});

document.getElementById('inventorySelect').addEventListener('change', (event) => {
    if (state.create.category === 'item') {
        state.create.selectedItem = event.target.value;
    } else {
        state.create.selectedPlate = event.target.value;
    }

    updateCreateDefaultsFromSelection(true);
    renderCreate();
});

document.getElementById('quantityInput').addEventListener('input', (event) => {
    state.create.quantity = Number(event.target.value || 1);
});

document.getElementById('durationInput').addEventListener('input', (event) => {
    state.create.durationMinutes = Number(event.target.value || 60);
});

document.getElementById('titleInput').addEventListener('input', (event) => {
    state.create.title = event.target.value || '';
});

document.getElementById('descriptionInput').addEventListener('input', (event) => {
    state.create.description = event.target.value || '';
});

document.getElementById('priceInput').addEventListener('input', (event) => {
    const value = Number(event.target.value || 0);
    if (state.create.listingType === 'auction') {
        state.create.minimumBid = value;
    } else {
        state.create.price = value;
    }
});

document.getElementById('advertisedInput').addEventListener('change', (event) => {
    state.create.advertised = event.target.checked;
});

document.getElementById('submitCreate').addEventListener('click', submitCreate);

document.getElementById('claimWalletBtn').addEventListener('click', async () => {
    await post('claimWallet');
});

document.body.addEventListener('click', async (event) => {
    const actionButton = event.target.closest('[data-action], [data-modal-action]');
    if (!actionButton) {
        return;
    }

    if (actionButton.dataset.action) {
        const action = actionButton.dataset.action;
        const id = Number(actionButton.dataset.id);

        if (action === 'open-browse') {
            openListingModal(findListing(id, false), false);
        } else if (action === 'open-my') {
            openListingModal(findListing(id, true), true);
        }

        return;
    }

    const modalAction = actionButton.dataset.modalAction;
    const id = Number(actionButton.dataset.id);
    const listing = findListing(id, true) || findListing(id, false);
    if (!listing) {
        return;
    }

    if (modalAction === 'edit') {
        openEditModal(listing);
    } else if (modalAction === 'delete') {
        await post('deleteListing', { id });
        closeModal();
    } else if (modalAction === 'claim') {
        await post('claimExpired', { id });
        closeModal();
    } else if (modalAction === 'buy') {
        const amountInput = document.getElementById('modalBuyAmount');
        const amount = amountInput ? Number(amountInput.value || 1) : 1;
        await post('buyListing', { listingId: id, amount });
        closeModal();
    } else if (modalAction === 'bid') {
        const bidInput = document.getElementById('modalBidInput');
        const amount = bidInput ? Number(bidInput.value || 0) : 0;
        await post('bidListing', { listingId: id, amount });
        closeModal();
    } else if (modalAction === 'save-edit') {
        const isAuction = actionButton.dataset.auction === '1';
        await post('updateListing', {
            id,
            title: document.getElementById('editTitle')?.value || '',
            description: document.getElementById('editDescription')?.value || '',
            advertised: document.getElementById('editAdvertised')?.checked === true,
            minimumBid: isAuction ? Number(document.getElementById('editPrice')?.value || 0) : 0,
            pricePerUnit: isAuction ? 0 : Number(document.getElementById('editPrice')?.value || 0)
        });
        closeModal();
    }
});
