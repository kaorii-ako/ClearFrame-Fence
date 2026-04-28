'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let fences = [];
let settings = { tint: 'warm', blur: 28, opacity: 0.22, cornerRadius: 22 };
let isLocked = false;
let ctxTargetFenceId = null;
let pickerTargetFenceId = null;
let allApps = [];   // { name, appPath }
let iconCache = {}; // appPath -> dataURL

// ── Persistence ───────────────────────────────────────────────────────────────
async function loadAll() {
  if (window.electronAPI) {
    const [sf, ss] = await Promise.all([
      window.electronAPI.loadFences(),
      window.electronAPI.loadSettings(),
    ]);
    if (sf) fences = sf;
    if (ss) settings = ss;
  } else {
    const sf = localStorage.getItem('lgf-fences');
    const ss = localStorage.getItem('lgf-settings');
    if (sf) fences = JSON.parse(sf);
    if (ss) settings = JSON.parse(ss);
  }
  if (fences.length === 0) fences = defaultFences();
  applySettings();
  renderAll();
}

function saveAll() {
  if (window.electronAPI) {
    window.electronAPI.saveFences(fences);
  } else {
    localStorage.setItem('lgf-fences', JSON.stringify(fences));
    localStorage.setItem('lgf-settings', JSON.stringify(settings));
  }
}

// ── Defaults ──────────────────────────────────────────────────────────────────
function defaultFences() {
  return [
    { id: uid(), title: 'My Apps', x: 40, y: 60, width: 280, height: null, icons: [] },
    { id: uid(), title: 'Work',    x: 340, y: 60, width: 240, height: null, icons: [] },
  ];
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderAll() {
  const root = document.getElementById('fences-root');
  root.innerHTML = '';
  fences.forEach(f => root.appendChild(buildFenceEl(f)));
}

function buildFenceEl(f) {
  const el = document.createElement('div');
  el.className = 'fence';
  el.dataset.id = f.id;
  el.style.left = f.x + 'px';
  el.style.top  = f.y + 'px';
  el.style.width = f.width + 'px';
  if (f.height) el.style.height = f.height + 'px';
  if (isLocked) el.classList.add('locked');

  // Header
  const header = document.createElement('div');
  header.className = 'fence-header';

  const dots = document.createElement('div');
  dots.className = 'fence-dots';
  ['red','yellow','green'].forEach(c => {
    const d = document.createElement('div');
    d.className = `dot ${c}`;
    if (c === 'red') d.addEventListener('click', e => { e.stopPropagation(); removeFence(f.id); });
    dots.appendChild(d);
  });

  const title = document.createElement('input');
  title.className = 'fence-title';
  title.value = f.title;
  title.setAttribute('readonly', '');
  title.addEventListener('focus', () => title.removeAttribute('readonly'));
  title.addEventListener('blur', () => {
    title.setAttribute('readonly', '');
    f.title = title.value;
    saveAll();
  });
  title.addEventListener('keydown', e => { if (e.key === 'Enter') title.blur(); });

  header.appendChild(dots);
  header.appendChild(title);
  el.appendChild(header);

  // Icons grid
  const grid = document.createElement('div');
  grid.className = 'icons-grid';
  f.icons.forEach(icon => grid.appendChild(buildIconEl(icon, f.id)));

  // Add App button
  const addCell = document.createElement('div');
  addCell.className = 'add-icon-cell';
  addCell.innerHTML = `<div class="icon-wrap" style="font-size:20px">＋</div><div class="icon-label">Add App</div>`;
  addCell.addEventListener('click', () => openPicker(f.id));
  grid.appendChild(addCell);
  el.appendChild(grid);

  // Resize handle
  const rh = document.createElement('div');
  rh.className = 'resize-handle';
  el.appendChild(rh);

  makeDraggable(el, header, f);
  makeResizable(el, rh, f);

  el.addEventListener('contextmenu', e => {
    e.preventDefault();
    openCtxMenu(e.clientX, e.clientY, f.id);
  });

  el.addEventListener('mouseenter', () => { if (window.electronAPI) window.electronAPI.setIgnoreMouse(false); });
  el.addEventListener('mouseleave', () => { if (window.electronAPI) window.electronAPI.setIgnoreMouse(true); });

  return el;
}

function buildIconEl(icon, fenceId) {
  const cell = document.createElement('div');
  cell.className = 'icon-item';
  cell.dataset.iconId = icon.id;
  cell.title = icon.label;

  // Icon image (native) or fallback
  const wrap = document.createElement('div');
  wrap.className = 'icon-wrap';

  if (icon.iconDataUrl) {
    const img = document.createElement('img');
    img.src = icon.iconDataUrl;
    img.width = 36; img.height = 36;
    img.style.borderRadius = '8px';
    img.style.objectFit = 'contain';
    wrap.appendChild(img);
  } else {
    wrap.style.background = 'rgba(255,200,160,0.35)';
    wrap.style.fontSize = '26px';
    wrap.textContent = icon.emoji || '📁';
    // Try to load real icon asynchronously
    if (icon.appPath && window.electronAPI) {
      window.electronAPI.getFileIcon(icon.appPath).then(dataUrl => {
        if (dataUrl) {
          icon.iconDataUrl = dataUrl;
          wrap.innerHTML = '';
          const img = document.createElement('img');
          img.src = dataUrl;
          img.width = 36; img.height = 36;
          img.style.borderRadius = '8px';
          img.style.objectFit = 'contain';
          wrap.appendChild(img);
          saveAll();
        }
      });
    }
  }

  const label = document.createElement('div');
  label.className = 'icon-label';
  label.textContent = icon.label;

  const rm = document.createElement('i');
  rm.className = 'remove-icon';
  rm.textContent = '✕';
  rm.addEventListener('click', e => { e.stopPropagation(); removeIcon(fenceId, icon.id); });

  // Launch on click
  cell.addEventListener('click', e => {
    if (e.target === rm) return;
    if (icon.appPath && window.electronAPI) {
      window.electronAPI.launchApp(icon.appPath);
    }
  });

  cell.appendChild(wrap);
  cell.appendChild(label);
  cell.appendChild(rm);
  return cell;
}

// ── Drag & Resize ─────────────────────────────────────────────────────────────
function makeDraggable(el, handle, f) {
  let startX, startY, startFX, startFY, dragging = false;

  handle.addEventListener('mousedown', e => {
    if (isLocked || e.target.closest('.fence-title') || e.target.closest('.dot')) return;
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    startFX = f.x; startFY = f.y;
    el.classList.add('dragging');
    el.style.zIndex = 500;
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    f.x = Math.max(0, startFX + (e.clientX - startX));
    f.y = Math.max(0, startFY + (e.clientY - startY));
    el.style.left = f.x + 'px';
    el.style.top  = f.y + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
    el.style.zIndex = '';
    saveAll();
  });
}

function makeResizable(el, handle, f) {
  let startX, startY, startW, startH, resizing = false;

  handle.addEventListener('mousedown', e => {
    if (isLocked) return;
    resizing = true;
    startX = e.clientX; startY = e.clientY;
    startW = el.offsetWidth; startH = el.offsetHeight;
    e.stopPropagation(); e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!resizing) return;
    f.width  = Math.max(180, startW + (e.clientX - startX));
    f.height = Math.max(110, startH + (e.clientY - startY));
    el.style.width  = f.width + 'px';
    el.style.height = f.height + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!resizing) return;
    resizing = false;
    saveAll();
  });
}

// ── Fence CRUD ────────────────────────────────────────────────────────────────
function addFence() {
  fences.push({
    id: uid(), title: 'New Fence',
    x: 80 + Math.random() * 160,
    y: 80 + Math.random() * 160,
    width: 240, height: null, icons: [],
  });
  renderAll();
  saveAll();
}

function removeFence(id) {
  fences = fences.filter(f => f.id !== id);
  document.querySelector(`.fence[data-id="${id}"]`)?.remove();
  saveAll();
}

function removeIcon(fenceId, iconId) {
  const f = fences.find(f => f.id === fenceId);
  if (f) f.icons = f.icons.filter(i => i.id !== iconId);
  document.querySelector(`[data-icon-id="${iconId}"]`)?.remove();
  saveAll();
}

// ── App Picker ────────────────────────────────────────────────────────────────
async function openPicker(fenceId) {
  pickerTargetFenceId = fenceId;
  document.getElementById('app-picker').classList.remove('hidden');
  document.getElementById('app-search').value = '';
  document.getElementById('app-list').innerHTML = '<div class="app-loading">Scanning apps…</div>';
  document.getElementById('app-search').focus();

  if (allApps.length === 0 && window.electronAPI) {
    allApps = await window.electronAPI.scanApps();
  }

  renderAppList(allApps);
}

function renderAppList(apps) {
  const list = document.getElementById('app-list');
  list.innerHTML = '';

  if (apps.length === 0) {
    list.innerHTML = '<div class="app-loading">No apps found</div>';
    return;
  }

  apps.slice(0, 120).forEach(appInfo => {
    const row = document.createElement('div');
    row.className = 'app-row';

    // Icon placeholder, load asynchronously
    const iconEl = document.createElement('div');
    iconEl.className = 'app-row-icon';
    iconEl.textContent = '📦';

    if (window.electronAPI) {
      const cached = iconCache[appInfo.appPath];
      if (cached) {
        setRowIcon(iconEl, cached);
      } else {
        // Load icon lazily
        const obs = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) {
            obs.disconnect();
            window.electronAPI.getFileIcon(appInfo.appPath).then(dataUrl => {
              if (dataUrl) {
                iconCache[appInfo.appPath] = dataUrl;
                setRowIcon(iconEl, dataUrl);
              }
            });
          }
        });
        obs.observe(row);
      }
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'app-row-name';
    nameEl.textContent = appInfo.name;

    row.appendChild(iconEl);
    row.appendChild(nameEl);

    row.addEventListener('click', () => addAppToFence(appInfo));
    list.appendChild(row);
  });
}

function setRowIcon(el, dataUrl) {
  el.innerHTML = '';
  const img = document.createElement('img');
  img.src = dataUrl;
  img.width = 32; img.height = 32;
  img.style.borderRadius = '7px';
  img.style.objectFit = 'contain';
  el.appendChild(img);
}

async function addAppToFence(appInfo) {
  const f = fences.find(f => f.id === pickerTargetFenceId);
  if (!f) return;

  // Get icon
  let iconDataUrl = iconCache[appInfo.appPath] || null;
  if (!iconDataUrl && window.electronAPI) {
    iconDataUrl = await window.electronAPI.getFileIcon(appInfo.appPath);
    if (iconDataUrl) iconCache[appInfo.appPath] = iconDataUrl;
  }

  const icon = {
    id: uid(),
    label: appInfo.name,
    appPath: appInfo.appPath,
    iconDataUrl: iconDataUrl || null,
    emoji: '📦',
  };

  f.icons.push(icon);

  // Add to DOM
  const grid = document.querySelector(`.fence[data-id="${f.id}"] .icons-grid`);
  if (grid) {
    const addCell = grid.querySelector('.add-icon-cell');
    grid.insertBefore(buildIconEl(icon, f.id), addCell);
  }

  saveAll();
  closePicker();
}

function closePicker() {
  document.getElementById('app-picker').classList.add('hidden');
  pickerTargetFenceId = null;
}

document.getElementById('close-picker').addEventListener('click', closePicker);

document.getElementById('app-search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = q ? allApps.filter(a => a.name.toLowerCase().includes(q)) : allApps;
  renderAppList(filtered);
});

// ── Context Menu ──────────────────────────────────────────────────────────────
function openCtxMenu(x, y, fenceId) {
  ctxTargetFenceId = fenceId;
  const menu = document.getElementById('ctx-menu');
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  menu.classList.remove('hidden');
}

function closeCtxMenu() { document.getElementById('ctx-menu').classList.add('hidden'); }

document.getElementById('ctx-menu').addEventListener('click', e => {
  const action = e.target.dataset.action;
  if (!action || !ctxTargetFenceId) return;
  const f = fences.find(f => f.id === ctxTargetFenceId);
  closeCtxMenu();
  if (action === 'rename' && f) {
    const el = document.querySelector(`.fence[data-id="${f.id}"] .fence-title`);
    if (el) { el.removeAttribute('readonly'); el.focus(); el.select(); }
  }
  if (action === 'add-icon') openPicker(ctxTargetFenceId);
  if (action === 'clear' && f) { f.icons = []; renderAll(); saveAll(); }
  if (action === 'delete') removeFence(ctxTargetFenceId);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#ctx-menu')) closeCtxMenu();
});

// ── Settings ──────────────────────────────────────────────────────────────────
function applySettings() {
  document.body.dataset.tint = settings.tint || 'warm';
  document.documentElement.style.setProperty('--blur', (settings.blur || 28) + 'px');
  document.documentElement.style.setProperty('--radius', (settings.cornerRadius || 22) + 'px');
  if (settings.tint === 'warm' || !settings.tint) {
    document.documentElement.style.setProperty('--tint-bg', `rgba(255, 210, 175, ${settings.opacity || 0.22})`);
  }
}

function openSettings() {
  const panel = document.getElementById('settings-panel');
  panel.classList.remove('hidden');
  document.getElementById('setting-tint').value = settings.tint || 'warm';
  document.getElementById('setting-blur').value = settings.blur || 28;
  document.getElementById('blur-val').textContent = settings.blur || 28;
  document.getElementById('setting-opacity').value = Math.round((settings.opacity || 0.22) * 100);
  document.getElementById('opacity-val').textContent = Math.round((settings.opacity || 0.22) * 100);
  document.getElementById('setting-radius').value = settings.cornerRadius || 22;
  document.getElementById('radius-val').textContent = settings.cornerRadius || 22;
}

document.getElementById('settings-fab').addEventListener('click', openSettings);
document.getElementById('close-settings').addEventListener('click', () => document.getElementById('settings-panel').classList.add('hidden'));
document.getElementById('add-fence-btn').addEventListener('click', () => { document.getElementById('settings-panel').classList.add('hidden'); addFence(); });

document.getElementById('setting-blur').addEventListener('input', e => {
  document.getElementById('blur-val').textContent = e.target.value;
  settings.blur = +e.target.value;
  document.documentElement.style.setProperty('--blur', e.target.value + 'px');
});
document.getElementById('setting-opacity').addEventListener('input', e => {
  document.getElementById('opacity-val').textContent = e.target.value;
  settings.opacity = +e.target.value / 100;
  applySettings();
});
document.getElementById('setting-radius').addEventListener('input', e => {
  document.getElementById('radius-val').textContent = e.target.value;
  settings.cornerRadius = +e.target.value;
  document.documentElement.style.setProperty('--radius', e.target.value + 'px');
});
document.getElementById('setting-tint').addEventListener('change', e => {
  settings.tint = e.target.value;
  applySettings();
});
document.getElementById('save-settings-btn').addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.saveSettings(settings);
  else localStorage.setItem('lgf-settings', JSON.stringify(settings));
  document.getElementById('settings-panel').classList.add('hidden');
});

// ── Electron IPC ──────────────────────────────────────────────────────────────
if (window.electronAPI) {
  window.electronAPI.onToggleLock(locked => {
    isLocked = locked;
    document.querySelectorAll('.fence').forEach(el => el.classList.toggle('locked', locked));
  });
  window.electronAPI.onAddFence(addFence);
  window.electronAPI.onOpenSettings(openSettings);
}

document.addEventListener('mousemove', e => {
  if (!window.electronAPI) return;
  const over = e.target.closest('.fence, #settings-fab, .settings-panel, .ctx-menu, .app-picker');
  window.electronAPI.setIgnoreMouse(!over);
});

// ── Utils ─────────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }

// ── Init ──────────────────────────────────────────────────────────────────────
loadAll();
