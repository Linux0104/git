/* ==========================================================================
   GANGWAR - STRADA #1 · Neon UI Controller
   - Vanilla JS, FiveM NUI compatible
   - Menü + HUD + Top-Message (KEIN Scoreboard, KEIN MVP)
   - Player count als einzelne Striche (Segmente)
   - Zonen mit Background-Bildern
   ========================================================================== */

const RESOURCE_NAME = 'gangwar';

/* Beispiel-Bilder (Unsplash) -- für den FiveM-Einsatz durch eigene nui:// URLs ersetzen */
const DEFAULT_ZONES = [
  { id: 'windraeder',   name: 'WINDRÄDER',        status: 'active', image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=70&auto=format' },
  { id: 'windraeder2',  name: 'WINDRÄDER 2',      status: 'wait',   image: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=600&q=70&auto=format' },
  { id: 'flugzeug',     name: 'FLUGZEUGFRIEDHOF', status: 'wait',   image: 'https://images.unsplash.com/photo-1583878312220-9d99c8a8c2c1?w=600&q=70&auto=format' },
  { id: 'fibhq',        name: 'FIB HQ',           status: 'active', image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&q=70&auto=format' },
  { id: 'vespucci',     name: 'VESPUCCI KANÄLE',  status: 'wait',   image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=70&auto=format' },
  { id: 'fibtanke',     name: 'FIB TANKE',        status: 'locked', image: 'https://images.unsplash.com/photo-1542759564-7ccbb6ac450a?w=600&q=70&auto=format' },
  { id: 'easthighway',  name: 'EAST HIGHWAY',     status: 'wait',   image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=70&auto=format' },
  { id: 'stadt',        name: 'STADT',            status: 'active', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=70&auto=format' },
  { id: 'sandy',        name: 'SANDY',            status: 'wait',   image: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600&q=70&auto=format' },
  { id: 'paleto',       name: 'PALETO',           status: 'wait',   image: 'https://images.unsplash.com/photo-1551524613-1b4f5ad3da9b?w=600&q=70&auto=format' },
  { id: 'oelfelder',    name: 'ÖLFELDER',         status: 'wait',   image: 'https://images.unsplash.com/photo-1487875961445-47a00398c267?w=600&q=70&auto=format' },
  { id: 'route68',      name: 'ROUTE68',          status: 'wait',   image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=70&auto=format' },
];

const STATUS_LABEL = {
  wait:   'Warte auf Angreifer',
  active: 'Kampf läuft',
  locked: 'Gesperrt',
};

function nuiPost(action, data = {}) {
  try {
    fetch(`https://${RESOURCE_NAME}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data),
    }).catch(() => {});
  } catch (e) {}
  console.log('[NUI]', action, data);
}

function iconSword() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline>
    <line x1="13" y1="19" x2="19" y2="13"></line>
    <line x1="16" y1="16" x2="20" y2="20"></line>
    <line x1="19" y1="21" x2="21" y2="19"></line>
  </svg>`;
}

/* ============== Render Zones (mit BG-Bild + Overlay) ============== */
function renderZones(zones) {
  const grid = document.getElementById('gwGrid');
  grid.innerHTML = '';
  zones.forEach(z => {
    const card = document.createElement('div');
    card.className = `gw-card ${z.status || 'wait'}`;
    card.dataset.zoneId = z.id;

    const bgImage = z.image
      ? `<div class="gw-card-bg" style="background-image:url('${z.image}')"></div>`
      : `<div class="gw-card-bg"></div>`;

    card.innerHTML = `
      ${bgImage}
      <div class="gw-card-overlay"></div>
      <div class="gw-card-icon">${iconSword()}</div>
      <div class="gw-card-info">
        <div class="gw-card-name">${z.name}</div>
        <div class="gw-card-status">${STATUS_LABEL[z.status] || STATUS_LABEL.wait}</div>
      </div>
      <button class="gw-attack-btn" data-action="attack" ${z.status === 'locked' ? 'disabled' : ''}>
        <span>${z.status === 'locked' ? 'GESPERRT' : 'ANGREIFEN'}</span>
      </button>
    `;

    card.querySelector('.gw-attack-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (z.status === 'locked') return;
      nuiPost('attackZone', { zoneId: z.id, zoneName: z.name });
    });

    grid.appendChild(card);
  });

  const counter = document.getElementById('gwZoneCount');
  if (counter) counter.textContent = String(zones.length).padStart(2, '0');
}

/* ============== HUD: Spieler-Segmente ============== */
function renderSegments(containerId, current, max) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const total = Math.max(0, Math.floor(max || 0));
  const filled = Math.max(0, Math.min(total, Math.floor(current || 0)));
  for (let i = 0; i < total; i++) {
    const seg = document.createElement('div');
    seg.className = 'hud_seg' + (i < filled ? ' filled' : '');
    container.appendChild(seg);
  }
}

function updateCountLabel(elId, current, max) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = `<strong>${current ?? 0}</strong><em>/${max ?? 0}</em>`;
}

/* ============== Tabs mit Smooth Transition ============== */
let _currentTab = 'gangwar';

function filterZonesForTab(tab, zones) {
  // Demo-Filter — in FiveM überschreibt der Server diese Logik via updateZones
  switch (tab) {
    case 'rewards':
      return zones.filter(z => z.status === 'active' || z.status === 'locked');
    case 'topfraks':
      return zones.filter(z => z.status === 'wait').slice(0, 6);
    case 'topplayers':
      return zones.slice(0, 8);
    case 'gangwar':
    default:
      return zones;
  }
}

function switchTab(tab) {
  if (tab === _currentTab) return;
  _currentTab = tab;

  const grid = document.getElementById('gwGrid');
  const titleEl = document.getElementById('gwMainTitle');
  const titleMap = {
    gangwar:    'GANGWAR',
    rewards:    'REWARDS',
    topfraks:   'TOP FRAKS',
    topplayers: 'TOP PLAYERS',
  };

  // 1) Animate out
  grid.classList.add('switching-out');
  titleEl.classList.add('switching');

  setTimeout(() => {
    // 2) Re-render with filtered data
    const filtered = filterZonesForTab(tab, DEFAULT_ZONES);
    renderZones(filtered);
    titleEl.textContent = titleMap[tab] || 'GANGWAR';

    // Force reflow so animation triggers
    void grid.offsetWidth;

    // 3) Animate in
    grid.classList.remove('switching-out');
    titleEl.classList.remove('switching');
  }, 280);
}

function bindTabs() {
  const tabs = document.querySelectorAll('.gw-tab');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const tab = t.dataset.tab;
      nuiPost('changeTab', { tab });
      switchTab(tab);
    });
  });
}

function bindClose() {
  document.querySelector('.gw-close').addEventListener('click', closeMenu);
  document.addEventListener('keyup', (e) => { if (e.key === 'Escape') closeMenu(); });
}
function closeMenu() {
  document.getElementById('gwMenu').style.display = 'none';
  nuiPost('closeMenu', {});
}
function openMenu() {
  document.getElementById('gwMenu').style.display = 'grid';
}

/* ============== HUD Update ============== */
function updateHud(data) {
  const wr = document.querySelector('.hud_wr');
  if (data.visible === false) { wr.style.display = 'none'; return; }
  wr.style.display = 'flex';

  if (data.attacker) {
    document.getElementById('attackerName').textContent = data.attacker.name || 'ANGREIFER';
    if (data.attacker.logo) document.getElementById('attackerLogo').src = data.attacker.logo;
    const cur = data.attacker.current || 0;
    const max = data.attacker.max || 0;
    renderSegments('attackerBarBg', cur, max);
    updateCountLabel('attackerCount', cur, max);
  }
  if (data.defender) {
    document.getElementById('defenderName').textContent = data.defender.name || 'VERTEIDIGER';
    if (data.defender.logo) document.getElementById('defenderLogo').src = data.defender.logo;
    const cur = data.defender.current || 0;
    const max = data.defender.max || 0;
    renderSegments('defenderBarBg', cur, max);
    updateCountLabel('defenderCount', cur, max);
  }
  if (data.timer !== undefined) {
    document.getElementById('timer').textContent = data.timer;
    const t = document.getElementById('hudTimer');
    if (data.warning) t.classList.add('warning'); else t.classList.remove('warning');
  }
}

function showTopMessage(text, durationMs = 3000) {
  const el = document.getElementById('topMessage');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(window._topMsgTimer);
  window._topMsgTimer = setTimeout(() => el.classList.remove('show'), durationMs);
}

window.addEventListener('message', (event) => {
  const msg = event.data || {};
  switch (msg.type) {
    case 'openMenu':
      if (Array.isArray(msg.zones)) renderZones(msg.zones);
      if (msg.stars !== undefined) document.getElementById('gwStars').textContent = String(msg.stars);
      openMenu();
      break;
    case 'closeMenu':
      closeMenu();
      break;
    case 'updateZones':
      if (Array.isArray(msg.zones)) renderZones(msg.zones);
      break;
    case 'updateStars':
      document.getElementById('gwStars').textContent = String(msg.stars ?? 0);
      break;
    case 'hud':
      updateHud(msg.data || {});
      break;
    case 'topMessage':
      showTopMessage(msg.text || '', msg.duration || 3000);
      break;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderZones(DEFAULT_ZONES);
  bindTabs();
  bindClose();

  // Initial-Segmente (alle leer) damit was zu sehen ist
  renderSegments('attackerBarBg', 0, 6);
  renderSegments('defenderBarBg', 0, 6);

  if (!window.invokeNative) {
    openMenu();
  } else {
    document.getElementById('gwMenu').style.display = 'none';
  }
});
