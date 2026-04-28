const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');

const { createTray, toggleWindow } = require('./src/main/tray');
const { registerShortcuts, unregisterShortcuts } = require('./src/main/shortcuts');
const { loadFences, saveFences, loadSettings, saveSettings, getAutoStart, setAutoLaunch } = require('./src/model/manager');
const { scanApps } = require('./src/util/apps');

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width, height, x: 0, y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    show: true,
    title: '',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.platform === 'win32') {
    mainWindow.setExcludeFromScreenCapture(true);
  }

  if (process.platform === 'darwin') mainWindow.setWindowButtonVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.on('close', e => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  createTray(mainWindow);
  registerShortcuts(toggleWindow);
  setAutoLaunch(true);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => { unregisterShortcuts(); });

if (process.argv.includes('--hidden')) {
  app.on('ready', () => {
    if (mainWindow) mainWindow.hide();
  });
}

ipcMain.on('save-fences', (_, data) => saveFences(data));
ipcMain.handle('load-fences', () => loadFences());
ipcMain.on('save-settings', (_, s) => saveSettings(s));
ipcMain.handle('load-settings', () => loadSettings());

ipcMain.on('set-ignore-mouse', (_, ignore) => {
  if (mainWindow) mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
});

ipcMain.handle('scan-apps', () => scanApps());

ipcMain.handle('get-file-icon', async (_, appPath) => {
  try {
    const icon = await app.getFileIcon(appPath, { size: 'large' });
    return icon.toDataURL();
  } catch (e) {
    return null;
  }
});

ipcMain.on('launch-app', (_, appPath) => {
  shell.openPath(appPath).catch(console.error);
});