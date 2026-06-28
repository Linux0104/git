/* ==========================================================================
   GANGWAR - STRADA #1 — UI Controller
   - Vanilla JS, FiveM NUI compatible
   - All UI actions emit `fetch` calls to the resource (replace RESOURCE_NAME)
   ========================================================================== */

const RESOURCE_NAME = 'gangwar'; // <-- ggf. anpassen, sollte = Name deiner FiveM-Resource sein

/* ----- Demo / Default Zones (werden vom Server überschrieben) ----- */
const DEFAULT_ZONES = [
  { id: 'windraeder',     name: 'WINDRÄDER',         status: 'wait', image: '' },
  { id: 'windraeder2',    name: 'WINDRÄDER 2',       status: 'wait', image: '' },
  { id: 'flugzeug',       name: 'FLUGZEUGFRIEDHOF',  status: 'wait', image: '' },
  { id: 'fibhq',          name: 'FIB HQ',            status: 'wait', image: '' },
  { id: 'vespucci',       name: 'VESPUCCI KANÄLE',   status: 'wait', image: '' },
  { id: 'fibtanke',       name: 'FIB TANKE',         status: 'wait', image: '' },
  { id: 'easthighway',    name: 'EAST HIGHWAY',      status: 'wait', image: '' },
  { id: 'stadt',          name: 'STADT',             status: 'wait', image: '' },
  { id: 'sandy',          name: 'SANDY',             status: 'wait', image: '' },
  { id: 'paleto',         name: 'PALETO',            status: 'wait', image: '' },
  { id: 'oelfelder',      name: 'ÖLFELDER',          status: 'wait', image: '' },
  { id: 'route68',        name: 'ROUTE68',           status: 'wait', image: '' },
];

const STATUS_LABEL = {
  wait:   'Warte auf Angreifer...',
  active: 'Kampf läuft',
  locked: 'Gesperrt',
};

/* ============================================================
   NUI helpers (FiveM)
   ============================================================ */
function nuiPost(action, data = {}) {
  // In FiveM erreichbar; im Browser einfach Log
  try {
    fetch(`https://${RESOURCE_NAME}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data),
    }).catch(() => {});
  } catch (e) {}
  console.log('[NUI]', action, data);
}

/* ============================================================
   Render: Card Grid
   ============================================================ */
function iconSword() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline>
    <line x1="13" y1="19" x2="19" y2="13"></line>
    <line x1="16" y1="16" x2="20" y2="20"></line>
    <line x1="19" y1="21" x2="21" y2="19"></line>
  </svg>`;
}

function renderZones(zones) {
  const grid = document.getElementById('gwGrid');
  grid.innerHTML = '';
  zones.forEach(z => {
    const card = document.createElement('div');
    card.className = `gw-card ${z.status || 'wait'}`;
    card.dataset.zoneId = z.id;

    const bgStyle = z.image ? `style="background-image:url('${z.image}')"` : '';

    card.innerHTML = `
      <div class="gw-card-bg" ${bgStyle}></div>
      <div class="gw-card-icon">${iconSword()}</div>
      <div class="gw-card-info">
        <div class="gw-card-name">${z.name}</div>
        <div class="gw-card-status">${STATUS_LABEL[z.status] || STATUS_LABEL.wait}</div>
      </div>
      <button class="gw-attack-btn" data-action="attack" ${z.status === 'locked' ? 'disabled' : ''}>
        ${z.status === 'locked' ? 'GESPERRT' : 'ANGREIFEN'}
      </button>
    `;

    card.querySelector('.gw-attack-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (z.status === 'locked') return;
      nuiPost('attackZone', { zoneId: z.id, zoneName: z.name });
    });

    grid.appendChild(card);
  });
}

/* ============================================================
   Render: Tabs
   ============================================================ */
function bindTabs() {
  const tabs = document.querySelectorAll('.gw-tab');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const tab = t.dataset.tab;
      nuiPost('changeTab', { tab });
      const titleEl = document.getElementById('gwMainTitle');
      const titleMap = {
        gangwar:    'GANGWAR',
        rewards:    'REWARDS',
        topfraks:   'TOP FRAKS',
        topplayers: 'TOP PLAYERS',
      };
      titleEl.textContent = titleMap[tab] || 'GANGWAR';
    });
  });
}

/* ============================================================
   Close Button + ESC
   ============================================================ */
function bindClose() {
  document.querySelector('.gw-close').addEventListener('click', () => {
    closeMenu();
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

function closeMenu() {
  const menu = document.getElementById('gwMenu');
  menu.style.display = 'none';
  nuiPost('closeMenu', {});
}

function openMenu() {
  const menu = document.getElementById('gwMenu');
  menu.style.display = 'flex';
}

/* ============================================================
   HUD Updates (von Server -> NUI Message)
   ============================================================ */
function updateHud(data) {
  // data: { visible, attacker:{name,logo,current,max}, defender:{...}, timer:"01:23" }
  const wr = document.querySelector('.hud_wr');
  if (data.visible === false) { wr.style.display = 'none'; return; }
  wr.style.display = 'flex';

  if (data.attacker) {
    document.getElementById('attackerName').textContent = data.attacker.name || 'ANGREIFER';
    if (data.attacker.logo) document.getElementById('attackerLogo').src = data.attacker.logo;
    const pct = data.attacker.max > 0 ? (data.attacker.current / data.attacker.max) * 100 : 0;
    document.getElementById('attackerBar').style.width = `${pct}%`;
    document.getElementById('attackerCount').textContent = `${data.attacker.current || 0} / ${data.attacker.max || 0}`;
  }
  if (data.defender) {
    document.getElementById('defenderName').textContent = data.defender.name || 'VERTEIDIGER';
    if (data.defender.logo) document.getElementById('defenderLogo').src = data.defender.logo;
    const pct = data.defender.max > 0 ? (data.defender.current / data.defender.max) * 100 : 0;
    document.getElementById('defenderBar').style.width = `${pct}%`;
    document.getElementById('defenderCount').textContent = `${data.defender.current || 0} / ${data.defender.max || 0}`;
  }
  if (data.timer !== undefined) {
    document.getElementById('timer').textContent = data.timer;
    const t = document.getElementById('hudTimer');
    if (data.warning) t.classList.add('warning'); else t.classList.remove('warning');
  }
}

/* ============================================================
   Scoreboard
   ============================================================ */
function showScoreboard(payload) {
  // payload: { title:'GEWINNER: SANTO', subtitle:'LUNAR', players:[{rank,name,kills}], visible:true }
  const sb = document.querySelector('.scoreboard');
  if (!payload.visible) { sb.style.display = 'none'; return; }
  sb.style.display = 'flex';
  sb.querySelector('.scoreboardTitle').textContent = payload.title || '';
  sb.querySelector('.scoreboardHeaderText p:first-child').textContent = payload.subtitle || '';
  const body = sb.querySelector('.scoreboardBody');
  body.innerHTML = '';
  (payload.players || []).forEach((p, idx) => {
    const row = document.createElement('div');
    row.className = 'scoreboardPlayer';
    row.innerHTML = `
      <div class="playerRanking">#${p.rank ?? idx + 1}</div>
      <div class="playerName">${p.name}</div>
      <img class="killIcon" src="./images/kill.png" alt="" onerror="this.style.display='none'">
      <div class="killAmount">${p.kills ?? 0}</div>
    `;
    body.appendChild(row);
  });
}

function showMvp(player) {
  const mvp = document.querySelector('.scoreboardMVP');
  if (!player) { mvp.style.display = 'none'; return; }
  mvp.style.display = 'block';
  mvp.querySelector('.playerRanking').textContent = `#${player.rank || 1}`;
  mvp.querySelector('.playerName').textContent = player.name || '';
  mvp.querySelector('.killAmount').textContent = player.kills ?? 0;
}

/* ============================================================
   Top Message
   ============================================================ */
function showTopMessage(text, durationMs = 3000) {
  const el = document.getElementById('topMessage');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(window._topMsgTimer);
  window._topMsgTimer = setTimeout(() => el.classList.remove('show'), durationMs);
}

/* ============================================================
   FiveM Message Listener
   - Server sendet z.B.: SendNUIMessage({ type: "openMenu", zones: [...] })
   ============================================================ */
window.addEventListener('message', (event) => {
  const msg = event.data || {};
  switch (msg.type) {
    case 'openMenu':
      if (Array.isArray(msg.zones)) renderZones(msg.zones);
      if (typeof msg.stars === 'number' || typeof msg.stars === 'string') {
        document.getElementById('gwStars').textContent = String(msg.stars);
      }
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
    case 'scoreboard':
      showScoreboard(msg.data || {});
      break;
    case 'mvp':
      showMvp(msg.player || null);
      break;
    case 'topMessage':
      showTopMessage(msg.text || '', msg.duration || 3000);
      break;
  }
});

/* ============================================================
   Init
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderZones(DEFAULT_ZONES);
  bindTabs();
  bindClose();

  // Menü standardmäßig versteckt im FiveM-Kontext
  // (Zum lokalen Vorschauen: anzeigen)
  if (!window.invokeNative) {
    // Browser-Vorschau -> Menü direkt zeigen
    openMenu();
  } else {
    document.getElementById('gwMenu').style.display = 'none';
  }
});
