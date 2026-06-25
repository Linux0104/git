let menuStack = [];
let isPostingAction = false;
let selectedIndex = 0;

window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.action === 'openMenu') {
        const existingIndex = menuStack.findIndex(m => m.namespace === data.namespace && m.name === data.name);

        const newMenu = {
            namespace: data.namespace,
            name: data.name,
            data: data.data,
            selectedIndex: 0
        };

        if (existingIndex !== -1) {
            newMenu.selectedIndex = menuStack[existingIndex].selectedIndex;
            menuStack[existingIndex] = newMenu;
        } else {
            menuStack.push(newMenu);
        }

        renderMenu(menuStack[menuStack.length - 1]);

    } else if (data.action === 'closeMenu') {
        menuStack = menuStack.filter(m => !(m.namespace === data.namespace && m.name === data.name));

        if (menuStack.length > 0) {
            renderMenu(menuStack[menuStack.length - 1]);
        } else {
            document.getElementById('app').style.display = 'none';
        }
    } else if (data.action === 'stepSelection') {
        if (menuStack.length === 0) return;
        const dir = Number(data.dir);
        if (!Number.isFinite(dir) || (dir !== 1 && dir !== -1)) return;
        stepSelection(dir);
    }
});

function renderMenu(menu) {
    if (!menu) return;

    const container = document.getElementById('menu-items');
    container.innerHTML = '';

    document.getElementById('menu-title').innerText = menu.data.title || 'MENU';

    menu.data.elements.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'menu-item';
        el.dataset.index = index;

        let iconHtml = '';

        item.label = item.label.replace(/[\u{1F300}-\u{1F6FF}]/ug, '').trim();

        if (item.value == 'wallet') iconHtml = '<i class="fas fa-wallet"></i>';
        else if (item.value == 'bills') iconHtml = '<i class="fas fa-file-invoice-dollar"></i>';
        else if (item.value == 'vehicle') iconHtml = '<i class="fas fa-car"></i>';
        else if (item.value == 'settings') iconHtml = '<i class="fas fa-cog"></i>';
        else if (item.value == 'extras') iconHtml = '<i class="fas fa-plus"></i>';
        else if (item.label.includes('Personalausweis')) iconHtml = '<i class="fas fa-id-card"></i>';
        else if (item.label.includes('Führerschein')) iconHtml = '<i class="fas fa-id-card"></i>';
        else if (item.label.includes('Waffenschein')) iconHtml = '<i class="fas fa-file-contract"></i>';
        else if (item.label.includes('Visum')) iconHtml = '<i class="fas fa-globe"></i>';
        else if (item.label.includes('Durchsuchen')) iconHtml = '<i class="fas fa-search"></i>';
        else if (item.label.includes('Handschellen')) iconHtml = '<i class="fas fa-link"></i>';
        else if (item.label.includes('Tragen')) iconHtml = '<i class="fas fa-people-carry"></i>';
        else if (item.label.includes('Fahrzeug')) iconHtml = '<i class="fas fa-car"></i>';
        else if (item.label.includes('Identität')) iconHtml = '<i class="fas fa-user-tag"></i>';
        else iconHtml = '<i class="fas fa-angle-right"></i>';

        if (item.type === 'slider') {
            el.dataset.type = 'slider';
            el.innerHTML = `
                <div class="item-left">
                    ${iconHtml}
                    <div class="item-separator"></div>
                    <span>${item.label}</span>
                </div>
                <div class="item-right selector-box">
                    <i class="fas fa-chevron-left"></i>
                    <span class="selector-value">&lt; ${item.value} &gt;</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
        } else if (item.type === 'list') {
            el.dataset.type = 'list';
            let label = "Invalid";
            if (item.options && item.options[item.value]) {
                label = item.options[item.value].label;
            }
            el.innerHTML = `
                <div class="item-left">
                    ${iconHtml}
                    <div class="item-separator"></div>
                    <span>${item.label}</span>
                </div>
                <div class="item-right selector-box">
                    <i class="fas fa-chevron-left"></i>
                    <span class="selector-value">${label}</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
        } else {
            el.dataset.type = 'default';
            el.innerHTML = `
                <div class="item-left">
                    ${iconHtml}
                    <div class="item-separator"></div>
                    <span>${item.label}</span>
                </div>
                <i class="fas fa-arrow-right"></i>
            `;
        }

        container.appendChild(el);
    });

    document.getElementById('app').style.display = 'flex';

    const statsContainer = document.getElementById('stats-container');
    const headerImg = document.getElementById('header-img');

    if (menu.data.isPersonalMenu) {
        statsContainer.style.display = 'flex';
        if (menu.data.visum !== undefined) {
            document.getElementById('visum-level').innerText = menu.data.visum;
        }
        if (menu.data.playtime !== undefined) {
            document.getElementById('playtime').innerText = menu.data.playtime + ' Std.';
        }
    } else {
        statsContainer.style.display = 'none';
    }

    selectedIndex = menu.selectedIndex || 0;
    if (selectedIndex >= menu.data.elements.length) selectedIndex = 0;

    updateSelection();
}

function updateSelection() {
    const currentMenu = menuStack[menuStack.length - 1];
    if (!currentMenu) return;

    const items = document.querySelectorAll('.menu-item');
    const scrollContainer = document.querySelector('.menu-items-scroll-container');

    const ensureVisible = (el) => {
        if (!scrollContainer || !el) return;
        const elRect = el.getBoundingClientRect();
        const contRect = scrollContainer.getBoundingClientRect();
        const overTop = elRect.top - contRect.top;
        const overBottom = elRect.bottom - contRect.bottom;
        if (overTop < 0) scrollContainer.scrollTop += overTop;
        else if (overBottom > 0) scrollContainer.scrollTop += overBottom;
    };

    items.forEach((el, index) => {
        if (index === selectedIndex) {
            el.classList.add('selected');
            ensureVisible(el);
        } else {
            el.classList.remove('selected');
        }
    });

    currentMenu.selectedIndex = selectedIndex;

    document.getElementById('menu-count').innerText = `${selectedIndex + 1}/${items.length}`;
}

let keyRepeatTimer = null;
let keyRepeatInterval = null;
let repeatingKey = null;

function clearKeyRepeat() {
    if (keyRepeatTimer) { clearTimeout(keyRepeatTimer); keyRepeatTimer = null; }
    if (keyRepeatInterval) { clearInterval(keyRepeatInterval); keyRepeatInterval = null; }
    repeatingKey = null;
}

function stepSelection(dir) {
    const currentMenu = menuStack[menuStack.length - 1];
    if (!currentMenu) return;

    selectedIndex += dir;
    if (selectedIndex < 0) selectedIndex = currentMenu.data.elements.length - 1;
    if (selectedIndex >= currentMenu.data.elements.length) selectedIndex = 0;
    updateSelection();
    playSound('NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET');
}

document.addEventListener('keydown', function(e) {
    const currentMenu = menuStack[menuStack.length - 1];
    if (!currentMenu) return;

    if (e.repeat) return;

    if (e.which === 38 || e.which === 40) {
        e.preventDefault();

        const dir = e.which === 38 ? -1 : 1;
        stepSelection(dir);

        clearKeyRepeat();
        repeatingKey = e.which;
        keyRepeatTimer = setTimeout(() => {
            keyRepeatInterval = setInterval(() => {
                if (repeatingKey !== e.which) return;
                stepSelection(dir);
            }, 40);
        }, 150);
        return;
    }
});

document.addEventListener('keyup', function(e) {
    const currentMenu = menuStack[menuStack.length - 1];
    if (!currentMenu) return;

    if (e.which === repeatingKey) {
        clearKeyRepeat();
    }

    if (e.which == 27 || e.which == 8) {
        postAction('menu_cancel', {
            _namespace: currentMenu.namespace,
            _name: currentMenu.name
        });
    } else if (e.which == 37) {
        handleLeftRight(-1);
    } else if (e.which == 39) {
        handleLeftRight(1);
    } else if (e.which == 13) {
        const item = currentMenu.data.elements[selectedIndex];
        postAction('menu_submit', {
            _namespace: currentMenu.namespace,
            _name: currentMenu.name,
            current: item
        });
        playSound('SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET');
    }
});

let wheelAccum = 0;
let lastWheelAt = 0;

window.addEventListener('wheel', function(e) {
    const currentMenu = menuStack[menuStack.length - 1];
    if (!currentMenu) return;

    e.preventDefault();

    const now = Date.now();
    if (now - lastWheelAt > 250) wheelAccum = 0;
    lastWheelAt = now;

    wheelAccum += e.deltaY;

    const threshold = 40;
    while (wheelAccum >= threshold) { stepSelection(1); wheelAccum -= threshold; }
    while (wheelAccum <= -threshold) { stepSelection(-1); wheelAccum += threshold; }
}, { passive: false });

function handleLeftRight(dir) {
    const currentMenu = menuStack[menuStack.length - 1];
    if (!currentMenu) return;

    const item = currentMenu.data.elements[selectedIndex];
    if (!item) return;

    let changed = false;

    if (item.type === 'slider') {
        if (typeof item.value !== 'number') item.value = 0;
        item.value += dir;

        if (item.min !== undefined && item.value < item.min) item.value = item.min;
        if (item.max !== undefined && item.value > item.max) item.value = item.max;

        changed = true;
    } else if (item.type === 'list') {
        if (!item.options) return;
        if (typeof item.value !== 'number') item.value = 0;

        item.value += dir;
        if (item.value < 0) item.value = item.options.length - 1;
        if (item.value >= item.options.length) item.value = 0;

        changed = true;
    }

    if (changed) {
        renderMenu(currentMenu);
        playSound('NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET');

        postAction('menu_change', {
            _namespace: currentMenu.namespace,
            _name: currentMenu.name,
            current: item,
            value: item.value
        });
    }
}

function playSound(sound, set) {
    if (typeof GetParentResourceName !== 'function') return;
    fetch(`https://${GetParentResourceName()}/playSound`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sound: sound, set: set})
    }).catch(() => {});
}

function postAction(action, data) {
    if (isPostingAction) return;
    isPostingAction = true;
    setTimeout(() => { isPostingAction = false; }, 200);

    if (typeof GetParentResourceName !== 'function') {
        isPostingAction = false;
        return;
    }

    fetch(`https://${GetParentResourceName()}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data)
    }).then(() => { isPostingAction = false; })
      .catch(() => { isPostingAction = false; });
}
