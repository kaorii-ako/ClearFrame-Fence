const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let isLocked = false;

// ── App scanning ──────────────────────────────────────────────────────────────
function scanApps() {
  const platform = process.platform;
  const results = [];

  if (platform === 'darwin') {
    const dirs = ['/Applications', path.join(os.homedir(), 'Applications')];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      try {
        fs.readdirSync(dir).forEach(file => {
          if (file.endsWith('.app') && !file.startsWith('.')) {
            results.push({ name: file.replace('.app', ''), appPath: path.join(dir, file) });
          }
        });
      } catch (e) {}
    }
  }

  if (platform === 'win32') {
    const dirs = [
      'C:\\Program Files',
      'C:\\Program Files (x86)',
      path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs'),
      path.join(process.env.PROGRAMDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs'),
    ];
    function scanDir(dir, depth = 0) {
      if (depth > 2 || !fs.existsSync(dir)) return;
      try {
        fs.readdirSync(dir).forEach(file => {
          const full = path.join(dir, file);
          try {
            const stat = fs.statSync(full);
            if (stat.isDirectory() && depth < 2) {
              scanDir(full, depth + 1);
            } else if (file.endsWith('.exe') || file.endsWith('.lnk')) {
              const name = file.replace(/\.(exe|lnk)$/, '');
              if (!name.match(/uninstall|setup|install|update|helper|crash|redist/i)) {
                results.push({ name, appPath: full });
              }
            }
          } catch (e) {}
        });
      } catch (e) {}
    }
    dirs.forEach(d => scanDir(d));
  }

  // Deduplicate by name, sort alphabetically
  const seen = new Set();
  return results
    .filter(a => { if (seen.has(a.name.toLowerCase())) return false; seen.add(a.name.toLowerCase()); return true; })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width, height, x: 0, y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.platform === 'darwin') mainWindow.setWindowButtonVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.on('save-fences', (_, data) => store.set('fences', data));
ipcMain.handle('load-fences', () => store.get('fences', null));
ipcMain.on('save-settings', (_, s) => store.set('settings', s));
ipcMain.handle('load-settings', () => store.get('settings', { tint: 'warm', blur: 28, opacity: 0.22, cornerRadius: 22 }));

ipcMain.on('set-ignore-mouse', (_, ignore) => {
  if (!isLocked) mainWindow?.setIgnoreMouseEvents(ignore, { forward: true });
});

// Scan installed apps
ipcMain.handle('scan-apps', () => scanApps());

// Get native file/app icon as base64 dataURL
ipcMain.handle('get-file-icon', async (_, appPath) => {
  try {
    const icon = await app.getFileIcon(appPath, { size: 'large' });
    return icon.toDataURL();
  } catch (e) {
    return null;
  }
});

// Launch app
ipcMain.on('launch-app', (_, appPath) => {
  shell.openPath(appPath).catch(console.error);
});

// ── Init ──────────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
