/* ==========================================================
   LUNAR'S FAHRZEUGVERMIETUNG · Neon UI logic
   (FiveM CEF compatible — no optional chaining / arrow funcs in hot paths)
   ========================================================== */

var app = document.getElementById('app');
var grid = document.getElementById('grid');
var tabs = document.getElementById('tabs');
var searchInput = document.getElementById('searchInput');
var closeBtn = document.getElementById('closeBtn');
var emptyState = document.getElementById('emptyState');
var vehicleCount = document.getElementById('vehicleCount');

var resourceName = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'lunar_carretail';

var vehicles = [];
var categories = [];
var activeCat = 'all';
var searchTerm = '';
var isOpen = false;

function hideUI() {
    app.classList.add('hidden');
    app.style.display = 'none';
    isOpen = false;
}

function showUI() {
    app.classList.remove('hidden');
    app.style.display = 'flex';
    isOpen = true;
}

function post(action, payload) {
    fetch('https://' + resourceName + '/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
    }).catch(function () {});
}

function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderTabs() {
    tabs.innerHTML = '';
    var ordered = ['all', 'economy', 'premium', 'luxury', 'commercial', 'sport', 'suv'];
    var rest = categories.filter(function (c) { return ordered.indexOf(c) === -1; });
    var finalCats = ordered.filter(function (c) { return c === 'all' || categories.indexOf(c) !== -1; }).concat(rest);
    // ensure 'all' is always present
    if (finalCats.indexOf('all') === -1) finalCats.unshift('all');

    finalCats.forEach(function (cat) {
        var btn = document.createElement('div');
        btn.className = 'tab' + (cat === activeCat ? ' active' : '');
        btn.textContent = cat === 'all' ? 'Alle Fahrzeuge' : capitalize(cat);
        btn.addEventListener('click', function () {
            activeCat = cat;
            renderTabs();
            renderCards();
        });
        tabs.appendChild(btn);
    });
}

function filtered() {
    var term = (searchTerm || '').toLowerCase();
    return vehicles.filter(function (v) {
        var catOk = activeCat === 'all' || v.category === activeCat;
        var label = v.label ? v.label.toLowerCase() : '';
        var model = v.model ? v.model.toLowerCase() : '';
        var searchOk = term === '' || label.indexOf(term) !== -1 || model.indexOf(term) !== -1;
        return catOk && searchOk;
    });
}

function formatPrice(n) {
    var num = Math.round(n || 0);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function renderCards() {
    grid.innerHTML = '';
    var list = filtered();

    if (vehicleCount) {
        vehicleCount.textContent = list.length + ' Fahrzeuge verfügbar';
    }

    if (list.length === 0) {
        if (emptyState) {
            emptyState.classList.remove('hidden');
            grid.appendChild(emptyState);
        }
        return;
    } else if (emptyState) {
        emptyState.classList.add('hidden');
    }

    list.forEach(function (v, idx) {
        var card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-testid', 'vehicle-card-' + (v.model || idx));

        // Image wrapper
        var imgWrap = document.createElement('div');
        imgWrap.className = 'card-img-wrap';

        var catBadge = document.createElement('div');
        catBadge.className = 'card-cat-badge';
        catBadge.textContent = v.category ? capitalize(v.category) : 'Sonstiges';
        imgWrap.appendChild(catBadge);

        var idBadge = document.createElement('div');
        idBadge.className = 'card-id-badge';
        idBadge.textContent = '#' + String(idx + 1).padStart(3, '0');
        imgWrap.appendChild(idBadge);

        var img = document.createElement('img');
        img.className = 'img';
        img.alt = v.label || v.model || 'Fahrzeug';
        if (v.image) {
            img.src = v.image;
            img.onerror = function () {
                this.onerror = null;
                this.src = 'images/placeholder.png';
            };
        } else {
            img.src = 'images/placeholder.png';
        }
        imgWrap.appendChild(img);

        // Body
        var body = document.createElement('div');
        body.className = 'body';

        var title = document.createElement('div');
        title.className = 'title';
        title.textContent = v.label || v.model || 'Unbekanntes Fahrzeug';

        var durationMin = Math.round((v.duration || 0) / 60000);
        var meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML =
            '<span class="meta-item"><span class="dot"></span>' + (v.model ? v.model.toUpperCase() : 'N/A') + '</span>' +
            '<span class="meta-item"><span class="dot"></span>' + durationMin + ' Min Mietzeit</span>';

        var price = document.createElement('div');
        price.className = 'price';
        price.innerHTML =
            '<span class="price-label">Mietpreis</span>' +
            '<span class="price-value">' + formatPrice(v.price) + '<span class="price-currency">$</span></span>';

        var action = document.createElement('div');
        action.className = 'action';
        var btn = document.createElement('button');
        btn.className = 'btn';
        btn.setAttribute('data-testid', 'rent-btn-' + (v.model || idx));
        btn.innerHTML = '<span>Jetzt mieten</span><span class="arrow">→</span>';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            btn.style.transform = 'scale(0.97)';
            setTimeout(function () { btn.style.transform = ''; }, 140);
            post('rent', { model: v.model, price: v.price, duration: v.duration });
        });
        action.appendChild(btn);

        body.appendChild(title);
        body.appendChild(meta);
        body.appendChild(price);
        body.appendChild(action);

        card.appendChild(imgWrap);
        card.appendChild(body);

        grid.appendChild(card);
    });
}

function openUI(data) {
    vehicles = (data && Array.isArray(data.vehicles)) ? data.vehicles : [];
    categories = (data && Array.isArray(data.categories)) ? data.categories : [];
    activeCat = 'all';
    searchTerm = '';
    if (searchInput) { searchInput.value = ''; }
    renderTabs();
    renderCards();
    showUI();
}

function closeUI() {
    hideUI();
    post('close');
}

window.addEventListener('message', function (event) {
    var data = event.data || {};
    if (data.action === 'open') {
        openUI(data);
    } else if (data.action === 'close') {
        hideUI();
    }
});

if (searchInput) {
    searchInput.addEventListener('input', function (e) {
        searchTerm = e.target.value || '';
        renderCards();
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeUI);
}

window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) {
        closeUI();
    }
});

/* -----------------------------------------------------------
   Demo mode — runs only when opened directly in a browser
   (not inside FiveM CEF). Enables previewing the design.
   ----------------------------------------------------------- */
(function () {
    var isFiveM = typeof GetParentResourceName === 'function';
    var params = new URLSearchParams(window.location.search);
    var forceDemo = params.get('demo') === '1';
    if (isFiveM && !forceDemo) return;

    var demoVehicles = [
        { label: 'Adder GT',        model: 'adder',      category: 'luxury',     price: 950000, duration: 1800000, image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=70' },
        { label: 'Zentorno Sport',  model: 'zentorno',   category: 'sport',      price: 725000, duration: 1500000, image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&auto=format&fit=crop&q=70' },
        { label: 'Sultan Classic',  model: 'sultan',     category: 'economy',    price: 12000,  duration: 600000,  image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&auto=format&fit=crop&q=70' },
        { label: 'Felon Coupe',     model: 'felon',      category: 'premium',    price: 85000,  duration: 1200000, image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop&q=70' },
        { label: 'Burrito Cargo',   model: 'burrito',    category: 'commercial', price: 18000,  duration: 900000,  image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&auto=format&fit=crop&q=70' },
        { label: 'Cavalcade SUV',   model: 'cavalcade',  category: 'suv',        price: 64000,  duration: 1200000, image: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=600&auto=format&fit=crop&q=70' },
        { label: 'Banshee Turbo',   model: 'banshee',    category: 'sport',      price: 184000, duration: 1500000, image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&auto=format&fit=crop&q=70' },
        { label: 'Tailgater Pro',   model: 'tailgater',  category: 'premium',    price: 42000,  duration: 1200000, image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop&q=70' }
    ];

    setTimeout(function () {
        openUI({
            vehicles: demoVehicles,
            categories: ['economy', 'premium', 'luxury', 'sport', 'suv', 'commercial']
        });
    }, 80);
})();

// Safe default: stay hidden until a message explicitly opens the UI
hideUI();
