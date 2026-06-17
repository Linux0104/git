/* =====================================================================
   BLIP.OS — NUI client logic
   100% kompatibel zur FiveM-Backend-API.
   Element-IDs und Callback-Endpoints sind identisch zum Original-Script,
   sodass kein Lua-Code angepasst werden muss.
   ===================================================================== */

const app = {
  visible: false,
  filter: 'all',
  search: '',
  selectedId: null,
  editorMode: 'create',
  sourceBlip: null,
  data: {
    blips: [],
    settings: {
      hidePersonal: false,
      hideShared: false,
      hideGlobal: false,
      hiddenBlips: {}
    },
    isAdmin: false,
    onlinePlayers: [],
    config: {
      defaults: {},
      displayModes: {},
      spriteSuggestions: [],
      colorSuggestions: []
    }
  }
};

const CATEGORY_ICONS = {
  personal: 'i-user',
  shared:   'i-share',
  global:   'i-globe'
};

function post(action, data = {}) {
  return fetch(`https://${GetParentResourceName()}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then((res) => res.json().catch(() => ({})));
}

function categoryLabel(category) {
  if (category === 'global') return 'Global';
  if (category === 'shared') return 'Geteilt';
  return 'Persönlich';
}

function typeLabel(type) {
  if (type === 'radius') return 'Radius';
  if (type === 'area') return 'Area';
  return 'Koordinate';
}

function displayLabel(display) {
  return app.data.config.displayModes[String(display)] || 'Unbekannt';
}

function getSelectedBlip() {
  return app.data.blips.find((blip) => Number(blip.id) === Number(app.selectedId)) || null;
}

function getFilteredBlips() {
  const search = app.search.trim().toLowerCase();
  return app.data.blips.filter((blip) => {
    if (app.filter !== 'all' && blip.category !== app.filter) return false;
    if (!search) return true;
    return (
      blip.name.toLowerCase().includes(search) ||
      categoryLabel(blip.category).toLowerCase().includes(search) ||
      typeLabel(blip.blipType).toLowerCase().includes(search)
    );
  });
}

function setVisible(visible) {
  app.visible = visible;
  document.getElementById('app').classList.toggle('hidden', !visible);
  if (!visible) {
    closeEditor();
    closeShare();
  }
}

function refreshCounters() {
  const counts = {
    all: app.data.blips.length,
    personal: app.data.blips.filter((blip) => blip.category === 'personal').length,
    shared:   app.data.blips.filter((blip) => blip.category === 'shared').length,
    global:   app.data.blips.filter((blip) => blip.category === 'global').length
  };

  document.getElementById('countAll').textContent = counts.all;
  document.getElementById('countPersonal').textContent = counts.personal;
  document.getElementById('countShared').textContent = counts.shared;
  document.getElementById('countGlobal').textContent = counts.global;

  document.querySelectorAll('.stat-card').forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === app.filter);
  });
}

function renderList() {
  const list = document.getElementById('blipList');
  const blips = getFilteredBlips();
  document.getElementById('visibleCount').textContent = `${blips.length} ENTRIES`;
  list.innerHTML = '';

  if (!blips.length) {
    const empty = document.createElement('div');
    empty.className = 'blip-item empty-state';
    empty.innerHTML = `
      <div class="blip-item-head">
        <strong>// NO SIGNAL</strong>
        <span class="chip">EMPTY</span>
      </div>
      <p>Keine Blips für den aktuellen Filter. Erstelle einen neuen Eintrag oder ändere den Filter.</p>
    `;
    list.appendChild(empty);
    return;
  }

  blips.forEach((blip) => {
    const hidden = app.data.settings.hiddenBlips && app.data.settings.hiddenBlips[blip.id];
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `blip-item ${Number(blip.id) === Number(app.selectedId) ? 'active' : ''}`;
    item.dataset.category = blip.category || 'personal';
    const iconId = CATEGORY_ICONS[blip.category] || 'i-pin';
    item.innerHTML = `
      <div class="blip-item-head">
        <strong>
          <svg class="ic blip-item-icon"><use href="#${iconId}"/></svg>
          ${escapeHtml(blip.name)}
        </strong>
        <span class="chip">${categoryLabel(blip.category)}</span>
      </div>
      <p>
        <span>${typeLabel(blip.blipType)}</span>
        <span class="sep">·</span>
        <span>${displayLabel(blip.display)}</span>
        <span class="sep">·</span>
        <span>SPR ${blip.sprite}</span>
        ${hidden ? '<span class="sep">·</span><span class="muted">HIDDEN</span>' : ''}
      </p>
    `;
    item.addEventListener('click', () => {
      app.selectedId = blip.id;
      render();
    });
    list.appendChild(item);
  });
}

function renderDetail() {
  const blip = getSelectedBlip();
  const empty = document.getElementById('detailEmpty');
  const detail = document.getElementById('detailView');

  if (!blip) {
    empty.classList.remove('hidden');
    detail.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  detail.classList.remove('hidden');

  const hidden = app.data.settings.hiddenBlips && app.data.settings.hiddenBlips[blip.id];
  document.getElementById('detailCategory').textContent = categoryLabel(blip.category);
  document.getElementById('detailName').textContent = blip.name;
  document.getElementById('detailOwner').textContent = blip.isGlobal
    ? '// Sichtbar für alle Spieler'
    : `// Owner · ${blip.ownerName || 'Unbekannt'}`;
  document.getElementById('detailType').textContent = typeLabel(blip.blipType);
  document.getElementById('detailSprite').textContent = blip.sprite;
  document.getElementById('detailColor').textContent = blip.color;
  document.getElementById('detailDisplay').textContent = displayLabel(blip.display);
  document.getElementById('detailCoords').textContent =
    `X ${Number(blip.coords.x).toFixed(2)}   Y ${Number(blip.coords.y).toFixed(2)}   Z ${Number(blip.coords.z).toFixed(2)}`;

  const toggleVisBtn = document.getElementById('toggleBlipVisibilityBtn');
  toggleVisBtn.innerHTML = hidden
    ? '<svg class="ic"><use href="#i-eye"/></svg><span>Einblenden</span>'
    : '<svg class="ic"><use href="#i-eye-off"/></svg><span>Ausblenden</span>';

  const extras = [];
  if (blip.blipType === 'coord')  extras.push(`Größe ${blip.scale}`);
  if (blip.blipType === 'radius') extras.push(`Radius ${blip.radius}`, `Alpha ${blip.alpha}`);
  if (blip.blipType === 'area')   extras.push(`Breite ${blip.width}`, `Höhe ${blip.height}`, `Alpha ${blip.alpha}`);
  extras.push(blip.shortRange ? 'Nahbereich aktiv' : 'Nahbereich aus');

  const extrasNode = document.getElementById('detailExtras');
  extrasNode.innerHTML = extras.map((entry) => `<span class="badge">${escapeHtml(entry)}</span>`).join('');

  document.getElementById('editBtn').classList.toggle('hidden', !blip.canEdit);
  document.getElementById('deleteBtn').classList.toggle('hidden', !blip.canEdit);
  document.getElementById('openShareBtn').classList.toggle('hidden', !blip.canShare);
  document.getElementById('sharePanel').classList.toggle('hidden', !blip.canShare);

  const shareTargets = document.getElementById('shareTargets');
  shareTargets.innerHTML = '';
  if (blip.canShare) {
    if (!blip.sharedTargets.length) {
      shareTargets.innerHTML = '<div class="share-entry empty"><span>// keine Freigaben aktiv</span></div>';
    } else {
      blip.sharedTargets.forEach((target) => {
        const entry = document.createElement('div');
        entry.className = 'share-entry';
        entry.innerHTML = `
          <span><svg class="ic" style="color:var(--neon)"><use href="#i-user"/></svg> ${escapeHtml(target.label)}</span>
          <button class="ghost-btn small danger" data-target="${escapeHtml(target.identifier)}">
            <svg class="ic"><use href="#i-trash"/></svg> Entfernen
          </button>
        `;
        entry.querySelector('button').addEventListener('click', async () => {
          const result = await post('revokeShare', {
            blipId: blip.id,
            targetIdentifier: target.identifier
          });
          if (result && result.ok) {
            syncFromClient(result.payload);
          }
        });
        shareTargets.appendChild(entry);
      });
    }
  }
}

function renderToggles() {
  document.getElementById('togglePersonal').checked = !app.data.settings.hidePersonal;
  document.getElementById('toggleShared').checked   = !app.data.settings.hideShared;
  document.getElementById('toggleGlobal').checked   = !app.data.settings.hideGlobal;
}

function render() {
  refreshCounters();
  renderToggles();
  renderList();
  renderDetail();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fillEditorHints() {
  document.getElementById('spriteHint').textContent = app.data.config.spriteSuggestions
    .map((entry) => `${entry.label}=${entry.value}`)
    .join('  |  ');
  document.getElementById('colorHint').textContent = app.data.config.colorSuggestions
    .map((entry) => `${entry.label}=${entry.value}`)
    .join('  |  ');

  const displaySelect = document.getElementById('fieldDisplay');
  displaySelect.innerHTML = '';
  Object.entries(app.data.config.displayModes)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      displaySelect.appendChild(option);
    });
}

function setField(id, value) {
  const node = document.getElementById(id);
  if (!node) return;
  if (node.type === 'checkbox') node.checked = !!value;
  else node.value = value ?? '';
}

function updateEditorVisibility() {
  const type = document.getElementById('fieldType').value;
  const positionMode = document.getElementById('fieldPositionMode').value;
  const isAdmin = app.data.isAdmin;

  document.getElementById('scopeField').classList.toggle('hidden', !isAdmin);
  document.getElementById('manualCoordsBox').classList.toggle('hidden', positionMode !== 'manual');
  document.getElementById('scaleField').classList.toggle('hidden', type !== 'coord');
  document.getElementById('alphaField').classList.toggle('hidden', type === 'coord');
  document.getElementById('radiusField').classList.toggle('hidden', type !== 'radius');
  document.getElementById('widthField').classList.toggle('hidden', type !== 'area');
  document.getElementById('heightField').classList.toggle('hidden', type !== 'area');
}

function openEditor(mode, blip = null) {
  app.editorMode = mode;
  app.sourceBlip = blip;
  fillEditorHints();

  const defaults = app.data.config.defaults || {};
  const titleMap = {
    create:    'Blip erstellen',
    edit:      'Blip bearbeiten',
    duplicate: 'Blip duplizieren'
  };
  document.getElementById('editorTitle').textContent = titleMap[mode] || 'Blip speichern';

  const useBlip = blip || {};
  setField('fieldName', useBlip.name || 'Neuer Blip');
  setField('fieldType', useBlip.blipType || 'coord');
  setField('fieldPositionMode', blip ? 'original' : 'current');
  setField('fieldScope', useBlip.isGlobal ? 'global' : 'personal');
  setField('fieldSprite', useBlip.sprite ?? defaults.sprite ?? 280);
  setField('fieldColor', useBlip.color ?? defaults.color ?? 0);
  setField('fieldDisplay', String(useBlip.display ?? defaults.display ?? 2));
  setField('fieldScale', useBlip.scale ?? defaults.scale ?? 0.9);
  setField('fieldAlpha', useBlip.alpha ?? defaults.alpha ?? 140);
  setField('fieldRadius', useBlip.radius ?? defaults.radius ?? 75);
  setField('fieldWidth', useBlip.width ?? defaults.width ?? 100);
  setField('fieldHeight', useBlip.height ?? defaults.height ?? 100);
  setField('fieldShortRange', useBlip.shortRange ?? defaults.shortRange ?? false);
  setField('fieldCoordX', useBlip.coords ? useBlip.coords.x : '');
  setField('fieldCoordY', useBlip.coords ? useBlip.coords.y : '');
  setField('fieldCoordZ', useBlip.coords ? useBlip.coords.z : '');

  if (!blip) {
    document.getElementById('fieldPositionMode').value = 'current';
  }

  if (!app.data.isAdmin) {
    document.getElementById('fieldScope').value = 'personal';
  }

  updateEditorVisibility();
  document.getElementById('editorModal').classList.remove('hidden');
}

function closeEditor() {
  document.getElementById('editorModal').classList.add('hidden');
}

function openShare() {
  const blip = getSelectedBlip();
  if (!blip) return;

  const select = document.getElementById('sharePlayerSelect');
  select.innerHTML = '';

  const existing = new Set((blip.sharedTargets || []).map((entry) => entry.identifier));
  const players = (app.data.onlinePlayers || []).filter((player) => !existing.has(player.identifier));

  if (!players.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '// kein verfügbarer Spieler';
    select.appendChild(option);
  } else {
    players.forEach((player) => {
      const option = document.createElement('option');
      option.value = String(player.source);
      option.textContent = `${player.name} (${player.source})`;
      select.appendChild(option);
    });
  }

  document.getElementById('shareModal').classList.remove('hidden');
}

function closeShare() {
  document.getElementById('shareModal').classList.add('hidden');
}

function syncFromClient(payload) {
  if (!payload) return;
  app.data = payload;
  if (!app.data.settings.hiddenBlips) app.data.settings.hiddenBlips = {};

  const stillExists = app.data.blips.some((entry) => Number(entry.id) === Number(app.selectedId));
  if (!stillExists) {
    app.selectedId = app.data.blips[0] ? app.data.blips[0].id : null;
  }
  render();
}

async function handleEditorSubmit(event) {
  event.preventDefault();

  const payload = {
    id: app.editorMode === 'edit' && app.sourceBlip ? app.sourceBlip.id : null,
    name: document.getElementById('fieldName').value.trim(),
    blipType: document.getElementById('fieldType').value,
    positionMode: document.getElementById('fieldPositionMode').value,
    isGlobal: app.data.isAdmin && document.getElementById('fieldScope').value === 'global',
    sprite: Number(document.getElementById('fieldSprite').value),
    color: Number(document.getElementById('fieldColor').value),
    display: Number(document.getElementById('fieldDisplay').value),
    scale: Number(document.getElementById('fieldScale').value),
    alpha: Number(document.getElementById('fieldAlpha').value),
    radius: Number(document.getElementById('fieldRadius').value),
    width: Number(document.getElementById('fieldWidth').value),
    height: Number(document.getElementById('fieldHeight').value),
    shortRange: document.getElementById('fieldShortRange').checked,
    originalCoords: app.sourceBlip && app.sourceBlip.coords ? app.sourceBlip.coords : null,
    coords: {
      x: Number(document.getElementById('fieldCoordX').value),
      y: Number(document.getElementById('fieldCoordY').value),
      z: Number(document.getElementById('fieldCoordZ').value)
    }
  };

  if (app.editorMode === 'duplicate') {
    payload.id = null;
  }

  const result = await post('saveBlip', payload);
  if (result && result.ok) {
    closeEditor();
    syncFromClient(result.payload);
    app.selectedId = result.id || app.selectedId;
    render();
  }
}

async function handleVisibilityChange() {
  const result = await post('updateVisibility', {
    hidePersonal: !document.getElementById('togglePersonal').checked,
    hideShared:   !document.getElementById('toggleShared').checked,
    hideGlobal:   !document.getElementById('toggleGlobal').checked,
    hiddenBlips:  app.data.settings.hiddenBlips || {}
  });
  if (result && result.ok) {
    syncFromClient(result.payload);
  }
}

function bindEvents() {
  document.getElementById('createBlipBtn').addEventListener('click', () => openEditor('create'));
  document.getElementById('closeBtn').addEventListener('click', () => post('close'));
  document.getElementById('reloadBtn').addEventListener('click', () => post('reloadData'));
  document.getElementById('searchInput').addEventListener('input', (event) => {
    app.search = event.target.value;
    renderList();
  });

  document.querySelectorAll('.stat-card').forEach((button) => {
    button.addEventListener('click', () => {
      app.filter = button.dataset.filter;
      render();
    });
  });

  document.getElementById('togglePersonal').addEventListener('change', handleVisibilityChange);
  document.getElementById('toggleShared').addEventListener('change', handleVisibilityChange);
  document.getElementById('toggleGlobal').addEventListener('change', handleVisibilityChange);

  document.getElementById('waypointBtn').addEventListener('click', async () => {
    const blip = getSelectedBlip();
    if (!blip) return;
    await post('setWaypoint', { blipId: blip.id });
  });

  document.getElementById('toggleBlipVisibilityBtn').addEventListener('click', async () => {
    const blip = getSelectedBlip();
    if (!blip) return;
    const result = await post('toggleBlipVisibility', { blipId: blip.id });
    if (result && result.ok) syncFromClient(result.payload);
  });

  document.getElementById('duplicateBtn').addEventListener('click', () => {
    const blip = getSelectedBlip();
    if (blip) openEditor('duplicate', blip);
  });

  document.getElementById('editBtn').addEventListener('click', () => {
    const blip = getSelectedBlip();
    if (blip) openEditor('edit', blip);
  });

  document.getElementById('deleteBtn').addEventListener('click', async () => {
    const blip = getSelectedBlip();
    if (!blip) return;
    const confirmed = window.confirm(`Soll "${blip.name}" wirklich gelöscht werden?`);
    if (!confirmed) return;
    const result = await post('deleteBlip', { blipId: blip.id });
    if (result && result.ok) syncFromClient(result.payload);
  });

  document.getElementById('openShareBtn').addEventListener('click', openShare);
  document.getElementById('closeShareBtn').addEventListener('click', closeShare);
  document.getElementById('cancelShareBtn').addEventListener('click', closeShare);
  document.getElementById('confirmShareBtn').addEventListener('click', async () => {
    const blip = getSelectedBlip();
    const targetSrc = document.getElementById('sharePlayerSelect').value;
    if (!blip || !targetSrc) return;
    const result = await post('shareBlip', { blipId: blip.id, targetSrc: Number(targetSrc) });
    if (result && result.ok) {
      closeShare();
      syncFromClient(result.payload);
    }
  });

  document.getElementById('fieldType').addEventListener('change', updateEditorVisibility);
  document.getElementById('fieldPositionMode').addEventListener('change', updateEditorVisibility);
  document.getElementById('editorForm').addEventListener('submit', handleEditorSubmit);
  document.getElementById('closeEditorBtn').addEventListener('click', closeEditor);
  document.getElementById('cancelEditorBtn').addEventListener('click', closeEditor);

  // Ctrl+K / Cmd+K to focus search
  window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      document.getElementById('searchInput').focus();
      document.getElementById('searchInput').select();
    }
    if (event.key === 'Escape') {
      if (!document.getElementById('editorModal').classList.contains('hidden')) {
        closeEditor();
      } else if (!document.getElementById('shareModal').classList.contains('hidden')) {
        closeShare();
      } else if (app.visible) {
        post('close');
      }
    }
  });
}

window.addEventListener('message', (event) => {
  const { action, payload } = event.data || {};

  if (action === 'open') {
    setVisible(true);
    syncFromClient(payload);
  } else if (action === 'sync') {
    syncFromClient(payload);
  } else if (action === 'close') {
    setVisible(false);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
});

/* Safety: in browsers without GetParentResourceName, define a stub so
   live preview / standalone testing won't crash. The actual FiveM NUI
   environment will always provide this function. */
if (typeof GetParentResourceName !== 'function') {
  // eslint-disable-next-line no-global-assign, no-implicit-globals
  GetParentResourceName = () => 'preview';
}
