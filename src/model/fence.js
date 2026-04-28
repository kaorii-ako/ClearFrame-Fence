function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function createFence(options = {}) {
  return {
    id: options.id || generateId(),
    title: options.title || 'New Fence',
    x: options.x !== undefined ? options.x : 80 + Math.random() * 160,
    y: options.y !== undefined ? options.y : 80 + Math.random() * 160,
    width: options.width || 240,
    height: options.height || null,
    icons: options.icons || [],
    locked: options.locked || false,
  };
}

function createIcon(options = {}) {
  return {
    id: options.id || generateId(),
    label: options.label || '',
    appPath: options.appPath || null,
    iconDataUrl: options.iconDataUrl || null,
    emoji: options.emoji || '📦',
  };
}

module.exports = { createFence, createIcon, generateId };