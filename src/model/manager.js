const Store = require('electron-store');
const { createFence } = require('./fence');

const store = new Store();

const defaultFences = () => [
  createFence({ title: 'My Apps', x: 40, y: 60, width: 280 }),
  createFence({ title: 'Work', x: 340, y: 60, width: 240 }),
];

function loadFences() {
  const fences = store.get('fences', null);
  if (!fences || fences.length === 0) {
    return defaultFences();
  }
  return fences;
}

function saveFences(fences) {
  store.set('fences', fences);
}

function loadSettings() {
  return store.get('settings', { tint: 'warm', blur: 28, opacity: 0.22, cornerRadius: 22 });
}

function saveSettings(settings) {
  store.set('settings', settings);
}

function getAutoStart() {
  return store.get('autoStart', true);
}

function setAutoStart(enabled) {
  store.set('autoStart', enabled);
}

module.exports = {
  loadFences,
  saveFences,
  loadSettings,
  saveSettings,
  getAutoStart,
  setAutoStart,
  defaultFences,
};