const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('forge', {
  isDesktop: true,
  getEnvironment: () => ipcRenderer.invoke('app:environment'),
  navigate: (tabId, address, engine, privateTab, background) => ipcRenderer.invoke('tab:navigate', tabId, address, engine, privateTab, background),
  activateTab: (tabId) => ipcRenderer.invoke('tab:activate', tabId),
  closeTab: (tabId) => ipcRenderer.invoke('tab:close', tabId),
  tabAction: (tabId, action) => ipcRenderer.invoke('tab:action', tabId, action),
  setContentBounds: (bounds) => ipcRenderer.send('layout:bounds', bounds),
  newPrivateWindow: () => ipcRenderer.invoke('window:new-private'),
  windowAction: (action) => ipcRenderer.invoke('window:action', action),
  getDownloads: () => ipcRenderer.invoke('downloads:list'),
  downloadAction: (id, action) => ipcRenderer.invoke('downloads:action', id, action),
  openDownloadFolder: () => ipcRenderer.invoke('downloads:open-folder'),
  getMetrics: () => ipcRenderer.invoke('system:metrics'),
  getNativeSettings: () => ipcRenderer.invoke('settings:get'),
  setNativeSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  chooseDownloadFolder: () => ipcRenderer.invoke('settings:choose-folder'),
  clearBrowsingData: (kind) => ipcRenderer.invoke('privacy:clear', kind),
  listCookies: () => ipcRenderer.invoke('privacy:cookies'),
  deleteCookiesForDomain: (domain) => ipcRenderer.invoke('privacy:delete-cookies', domain),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  autoCheckForUpdates: () => ipcRenderer.invoke('updates:auto-check'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  openRelease: () => ipcRenderer.invoke('updates:open-release'),
  openDefaultApps: () => ipcRenderer.invoke('system:default-apps'),
  mediaAction: (tabId, action) => ipcRenderer.invoke('media:action', tabId, action),
  onTabState: (callback) => subscribe('tab:state', callback),
  onOpenTab: (callback) => subscribe('tab:open-requested', callback),
  onDownload: (callback) => subscribe('downloads:changed', callback),
  onShortcut: (callback) => subscribe('app:shortcut', callback),
  onWindowState: (callback) => subscribe('window:state', callback),
  onUpdateState: (callback) => subscribe('updates:state', callback),
});