const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFences:    (data) => ipcRenderer.send('save-fences', data),
  loadFences:    () => ipcRenderer.invoke('load-fences'),
  saveSettings:  (s) => ipcRenderer.send('save-settings', s),
  loadSettings:  () => ipcRenderer.invoke('load-settings'),
  setIgnoreMouse:(ignore) => ipcRenderer.send('set-ignore-mouse', ignore),

  // Real apps
  scanApps:      () => ipcRenderer.invoke('scan-apps'),
  getFileIcon:   (appPath) => ipcRenderer.invoke('get-file-icon', appPath),
  launchApp:     (appPath) => ipcRenderer.send('launch-app', appPath),

  // IPC listeners
  onToggleLock:  (cb) => ipcRenderer.on('toggle-lock', (_, v) => cb(v)),
  onAddFence:    (cb) => ipcRenderer.on('add-fence', () => cb()),
  onOpenSettings:(cb) => ipcRenderer.on('open-settings', () => cb()),
});
