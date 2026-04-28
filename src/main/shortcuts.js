const { globalShortcut } = require('electron');

let toggleCallback = null;

function registerShortcuts(onToggle) {
  toggleCallback = onToggle;
  const ret = globalShortcut.register('CommandOrControl+Shift+F', () => {
    if (toggleCallback) toggleCallback();
  });

  if (!ret) {
    console.log('Global shortcut registration failed');
  }
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

module.exports = { registerShortcuts, unregisterShortcuts };