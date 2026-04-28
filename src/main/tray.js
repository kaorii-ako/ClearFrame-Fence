const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let tray = null;
let mainWindow = null;

function createTray(win) {
  mainWindow = win;
  const iconPath = path.join(__dirname, '..', 'tray-icon.png');
  let trayIcon;

  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();
  }

  if (process.platform === 'win32') {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Liquid Glass Fences');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: () => toggleWindow() },
    { type: 'separator' },
    { label: 'Always on Top', type: 'checkbox', checked: false, click: (item) => {
      if (mainWindow) mainWindow.setAlwaysOnTop(item.checked);
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => {
      const { app } = require('electron');
      app.isQuitting = true;
      app.quit();
    }}
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => toggleWindow());
}

function toggleWindow() {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  }
}

function getTray() {
  return tray;
}

module.exports = { createTray, toggleWindow, getTray };