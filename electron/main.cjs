const { app, BrowserWindow, WebContentsView, ipcMain, session, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { isWebUrl, resolveAddress, describeLoadError } = require('./navigation.cjs');
const { readJson, writeJson, loadNativeSettings, validateSettingsPatch } = require('./storage.cjs');
const { checkLatestRelease } = require('./updates.cjs');

app.setName('Forge Browser');
if (process.platform === 'win32') app.setAppUserModelId('studios.forge.browser');

const windows = new Map();
const sessionsReady = new WeakSet();
const liveDownloads = new Map();
const downloads = new Map();
let nativeSettings;
let latestRelease = null;

const trackerHosts = new Set([
  'google-analytics.com', 'googletagmanager.com', 'doubleclick.net',
  'connect.facebook.net', 'facebook.net', 'scorecardresearch.com',
  'hotjar.com', 'segment.io', 'mixpanel.com', 'adsrvr.org',
]);

function shellState(event) {
  const state = windows.get(event.sender.id);
  if (!state || event.senderFrame !== event.sender.mainFrame) throw new Error('Origem IPC não autorizada.');
  return state;
}

function send(state, channel, payload) {
  if (!state.win.isDestroyed() && !state.win.webContents.isDestroyed()) {
    state.win.webContents.send(channel, payload);
  }
}

function persistDownloads() {
  writeJson('downloads.json', [...downloads.values()].filter((record) => !record.private).slice(0, 200));
}

function visibleDownloads(state) {
  return [...downloads.values()].filter((record) => state.privateMode
    ? record.windowId === state.win.id
    : !record.private || record.windowId === state.win.id);
}

function announceDownload(record) {
  for (const state of windows.values()) {
    if (record.windowId === state.win.id || (!state.privateMode && !record.private)) {
      send(state, 'downloads:changed', record);
    }
  }
}

function savePathFor(filename) {
  const folder = nativeSettings.downloadPath && fs.existsSync(nativeSettings.downloadPath)
    ? nativeSettings.downloadPath : app.getPath('downloads');
  const safeName = path.basename(filename).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') || 'download';
  const extension = path.extname(safeName);
  const base = path.basename(safeName, extension);
  let destination = path.join(folder, safeName);
  let number = 1;
  while (fs.existsSync(destination)) destination = path.join(folder, `${base} (${number++})${extension}`);
  return destination;
}

function setupSession(ses) {
  if (sessionsReady.has(ses)) return;
  sessionsReady.add(ses);

  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    let allowed = false;
    try {
      const origin = new URL(details.requestingUrl || contents.getURL()).origin;
      allowed = origin.startsWith('https://') && nativeSettings.sitePermissions[`${origin}|${permission}`] === true;
      if (permission === 'notifications' && nativeSettings.blockNotifications) allowed = false;
    } catch { /* Deny malformed origins. */ }
    callback(allowed);
  });
  ses.setPermissionCheckHandler((contents, permission, requestingOrigin) => {
    if (permission === 'notifications' && nativeSettings.blockNotifications) return false;
    try {
      const origin = new URL(requestingOrigin || contents?.getURL()).origin;
      return origin.startsWith('https://') && nativeSettings.sitePermissions[`${origin}|${permission}`] === true;
    } catch { return false; }
  });

  // This is a deliberately small known-domain filter, not a claim of comprehensive ad blocking.
  ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    if (!nativeSettings.blockTrackers || details.resourceType === 'mainFrame') return callback({});
    try {
      const host = new URL(details.url).hostname;
      const blocked = [...trackerHosts].some((domain) => host === domain || host.endsWith(`.${domain}`));
      callback({ cancel: blocked });
    } catch { callback({}); }
  });

  ses.on('will-download', (_event, item, contents) => {
    let owner = [...windows.values()].find((state) => [...state.tabs.values()].some((tab) => tab.view.webContents.id === contents?.id));
    if (!owner) owner = [...windows.values()].find((state) => [...state.tabs.values()].some((tab) => tab.view.webContents.session === ses));
    if (!owner) owner = [...windows.values()].find((state) => session.fromPartition(state.partition) === ses);
    if (!owner) owner = [...windows.values()].find((state) => !state.privateMode);
    if (!owner) { item.cancel(); return; }
    const sourceTab = [...owner.tabs.values()].find((tab) => tab.view.webContents.id === contents?.id)
      || [...owner.tabs.values()].find((tab) => tab.view.webContents.session === ses);

    const id = randomUUID();
    const destination = savePathFor(item.getFilename());
    if (nativeSettings.askDownloadLocation) item.setSaveDialogOptions({ defaultPath: destination });
    else item.setSavePath(destination);

    const record = {
      id, filename: item.getFilename(), url: item.getURL(), totalBytes: item.getTotalBytes(),
      receivedBytes: 0, speed: 0, status: 'progressing', path: nativeSettings.askDownloadLocation ? '' : destination,
      startedAt: Date.now(), private: owner.privateMode || Boolean(sourceTab?.private),
      windowId: owner.win.id, tabId: sourceTab?.id || null,
    };
    downloads.set(id, record);
    liveDownloads.set(id, item);
    announceDownload(record);

    item.on('updated', (_updateEvent, status) => {
      record.receivedBytes = item.getReceivedBytes();
      record.totalBytes = item.getTotalBytes();
      record.speed = item.getCurrentBytesPerSecond();
      record.status = status === 'interrupted' ? 'interrupted' : item.isPaused() ? 'paused' : 'progressing';
      record.path = item.getSavePath() || record.path;
      announceDownload(record);
    });
    item.once('done', (_doneEvent, status) => {
      if (!downloads.has(id)) { liveDownloads.delete(id); return; }
      record.receivedBytes = item.getReceivedBytes();
      record.path = item.getSavePath() || record.path;
      record.speed = 0;
      record.status = status;
      liveDownloads.delete(id);
      announceDownload(record);
      if (!record.private) persistDownloads();
    });
  });
}

function contentBounds(state) {
  const size = state.win.contentView.getBounds();
  const requested = state.bounds || { x: 70, y: 104, width: size.width - 70, height: size.height - 104 };
  const x = Math.max(0, Math.min(Math.round(requested.x), size.width));
  const y = Math.max(0, Math.min(Math.round(requested.y), size.height));
  return { x, y, width: Math.max(0, Math.min(Math.round(requested.width), size.width - x)), height: Math.max(0, Math.min(Math.round(requested.height), size.height - y)) };
}

function showActiveView(state) {
  for (const [id, tab] of state.tabs) {
    const active = id === state.activeId && !tab.error;
    tab.view.setVisible(active);
    if (active) {
      tab.view.setBounds(contentBounds(state));
      state.win.contentView.addChildView(tab.view);
    }
  }
}

function tabSnapshot(tab, extra = {}) {
  const contents = tab.view.webContents;
  const url = contents.getURL() || tab.requestedUrl;
  return {
    tabId: tab.id, url, title: tab.title || (isWebUrl(url) ? new URL(url).hostname : 'Nova aba'),
    loading: contents.isLoading(), canGoBack: contents.navigationHistory.canGoBack(),
    canGoForward: contents.navigationHistory.canGoForward(),
    security: url.startsWith('https://') ? 'secure' : 'insecure', error: tab.error, ...extra,
  };
}

function wireTab(state, tab) {
  const contents = tab.view.webContents;
  const report = (extra) => send(state, 'tab:state', tabSnapshot(tab, extra));
  contents.on('did-start-loading', () => { tab.error = null; report(); });
  contents.on('did-stop-loading', () => report());
  contents.on('page-title-updated', (_event, title) => { tab.title = title.slice(0, 160); report(); });
  contents.on('did-navigate', () => { tab.error = null; report({ navigated: true }); });
  contents.on('did-navigate-in-page', (_event, _url, isMainFrame) => { if (isMainFrame) report({ navigated: true }); });
  contents.on('did-fail-load', (_event, code, _description, url, isMainFrame) => {
    if (!isMainFrame || code === -3) return;
    tab.error = describeLoadError(code);
    if (state.activeId === tab.id) tab.view.setVisible(false);
    report({ url: url || tab.requestedUrl, loading: false });
  });
  contents.on('render-process-gone', () => {
    tab.error = 'loading';
    if (state.activeId === tab.id) tab.view.setVisible(false);
    report({ loading: false });
  });
  contents.on('will-navigate', (event, navigation) => {
    const url = typeof navigation === 'string' ? navigation : navigation.url;
    if (!isWebUrl(url)) event.preventDefault();
  });
  contents.on('will-redirect', (event, navigation) => {
    const url = typeof navigation === 'string' ? navigation : navigation.url;
    if (!isWebUrl(url)) event.preventDefault();
  });
  contents.setWindowOpenHandler((details) => {
    const genuineLink = details.userGesture || ['foreground-tab', 'background-tab'].includes(details.disposition);
    if (isWebUrl(details.url) && (!nativeSettings.blockPopups || genuineLink)) {
      send(state, 'tab:open-requested', { url: details.url, background: details.disposition === 'background-tab', private: tab.private });
    }
    return { action: 'deny' };
  });
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !(input.control || input.meta)) return;
    const key = input.key.toLowerCase();
    let shortcut = null;
    if (key === 'l') shortcut = 'address';
    if (key === 't') shortcut = input.shift ? 'reopen' : 'new-tab';
    if (key === 'w') shortcut = 'close-tab';
    if (key === 'r') shortcut = 'reload';
    if (key === 'n' && input.shift) shortcut = 'private-window';
    if (shortcut) { event.preventDefault(); send(state, 'app:shortcut', shortcut); }
  });
}

function createExternalTab(state, id, privateTab) {
  const partition = state.privateMode ? state.partition : privateTab ? `forge-private-tab-${randomUUID()}` : 'persist:forge-web';
  const ses = session.fromPartition(partition);
  setupSession(ses);
  const view = new WebContentsView({
    webPreferences: {
      partition, sandbox: true, contextIsolation: true, nodeIntegration: false,
      webSecurity: true, webviewTag: false,
    },
  });
  view.setBackgroundColor('#f9f9f9');
  view.setVisible(false);
  const tab = { id, view, partition, private: privateTab || state.privateMode, title: '', requestedUrl: '', error: null };
  state.tabs.set(id, tab);
  wireTab(state, tab);
  state.win.contentView.addChildView(view);
  return tab;
}

function createWindow(privateMode = false) {
  const partition = privateMode ? `forge-private-window-${randomUUID()}` : 'persist:forge-web';
  if (privateMode) setupSession(session.fromPartition(partition));
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 860, minHeight: 580, frame: false,
    show: false, backgroundColor: '#0b1015', title: privateMode ? 'Forge Browser - Privado' : 'Forge Browser',
    icon: path.join(__dirname, '..', app.isPackaged ? 'dist' : 'public', 'icons', 'forge-app.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      partition: privateMode ? `forge-private-shell-${randomUUID()}` : undefined,
      sandbox: true, contextIsolation: true, nodeIntegration: false,
      webSecurity: true, webviewTag: false,
    },
  });
  const state = { win, privateMode, partition, tabs: new Map(), activeId: null, bounds: null };
  windows.set(win.webContents.id, state);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, navigation) => {
    const url = typeof navigation === 'string' ? navigation : navigation.url;
    if (url !== win.webContents.getURL()) event.preventDefault();
  });
  win.on('resize', () => showActiveView(state));
  win.on('maximize', () => send(state, 'window:state', { maximized: true }));
  win.on('unmaximize', () => send(state, 'window:state', { maximized: false }));
  const shellId = win.webContents.id;
  win.on('closed', () => {
    for (const tab of state.tabs.values()) {
      if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
    }
    if (privateMode) {
      for (const [id, record] of downloads) {
        if (record.windowId === win.id) { liveDownloads.get(id)?.cancel(); downloads.delete(id); }
      }
      session.fromPartition(partition).clearStorageData().catch(() => {});
    }
    windows.delete(shellId);
  });
  win.once('ready-to-show', () => win.show());

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  } else {
    win.loadURL(process.env.FORGE_DEV_URL || 'http://localhost:5173').catch(() => {
      const built = path.join(__dirname, '..', 'dist', 'index.html');
      if (fs.existsSync(built)) win.loadFile(built);
    });
  }
  return win;
}

function registerIpc() {
  ipcMain.handle('app:environment', (event) => {
    const state = shellState(event);
    return { privateMode: state.privateMode, version: app.isPackaged ? app.getVersion() : '1.0.0-dev', platform: process.platform };
  });
  ipcMain.on('layout:bounds', (event, bounds) => {
    const state = shellState(event);
    if (!bounds || ![bounds.x, bounds.y, bounds.width, bounds.height].every((n) => Number.isFinite(n) && n >= 0 && n < 10000)) return;
    state.bounds = bounds;
    showActiveView(state);
  });
  ipcMain.handle('tab:navigate', async (event, id, address, engine, privateTab = false, background = false) => {
    const state = shellState(event);
    if (typeof id !== 'string' || !/^[\w-]{1,100}$/.test(id)) throw new Error('Aba inválida.');
    const url = resolveAddress(address, engine);
    const tab = state.tabs.get(id) || createExternalTab(state, id, privateTab === true);
    tab.requestedUrl = url;
    tab.title = new URL(url).hostname;
    tab.error = null;
    if (!background) state.activeId = id;
    showActiveView(state);
    tab.view.webContents.loadURL(url).catch(() => {});
    return { url };
  });
  ipcMain.handle('tab:activate', (event, id) => {
    const state = shellState(event);
    state.activeId = typeof id === 'string' && state.tabs.has(id) ? id : null;
    showActiveView(state);
    return true;
  });
  ipcMain.handle('tab:close', (event, id) => {
    const state = shellState(event);
    const tab = state.tabs.get(id);
    if (!tab) return false;
    state.win.contentView.removeChildView(tab.view);
    tab.view.webContents.close();
    state.tabs.delete(id);
    if (state.activeId === id) state.activeId = null;
    if (tab.private && !state.privateMode) {
      session.fromPartition(tab.partition).clearStorageData().catch(() => {});
      for (const [downloadId, record] of downloads) {
        if (record.tabId === id) { liveDownloads.get(downloadId)?.cancel(); downloads.delete(downloadId); }
      }
    }
    return true;
  });
  ipcMain.handle('tab:action', (event, id, action) => {
    const state = shellState(event);
    const tab = state.tabs.get(id);
    if (!tab) return false;
    const contents = tab.view.webContents;
    if (action === 'back' && contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
    else if (action === 'forward' && contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
    else if (action === 'reload') {
      const failed = Boolean(tab.error);
      tab.error = null;
      showActiveView(state);
      if (failed && tab.requestedUrl) contents.loadURL(tab.requestedUrl).catch(() => {});
      else if (contents.getURL()) contents.reload();
      else if (tab.requestedUrl) contents.loadURL(tab.requestedUrl).catch(() => {});
    } else if (action === 'stop') contents.stop();
    else return false;
    return true;
  });
  ipcMain.handle('window:new-private', (event) => { shellState(event); createWindow(true); return true; });
  ipcMain.handle('window:action', (event, action) => {
    const { win } = shellState(event);
    if (action === 'minimize') win.minimize();
    else if (action === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
    else if (action === 'close') win.close();
    else return false;
    return true;
  });
  ipcMain.handle('downloads:list', (event) => visibleDownloads(shellState(event)));
  ipcMain.handle('downloads:open-folder', async (event) => {
    shellState(event);
    const folder = nativeSettings.downloadPath && fs.existsSync(nativeSettings.downloadPath)
      ? nativeSettings.downloadPath : app.getPath('downloads');
    return shell.openPath(folder);
  });
  ipcMain.handle('downloads:action', async (event, id, action) => {
    const state = shellState(event);
    const record = downloads.get(id);
    if (!record || !visibleDownloads(state).includes(record)) return false;
    const item = liveDownloads.get(id);
    if (action === 'pause' && item) item.pause();
    else if (action === 'resume' && item && (item.isPaused() || item.canResume())) item.resume();
    else if (action === 'cancel' && item) item.cancel();
    else if (action === 'open' && record.status === 'completed' && fs.existsSync(record.path)) return shell.openPath(record.path);
    else if (action === 'folder' && record.path && fs.existsSync(record.path)) shell.showItemInFolder(record.path);
    else return false;
    return true;
  });
  ipcMain.handle('system:metrics', (event) => {
    shellState(event);
    const processes = app.getAppMetrics();
    return {
      ramMB: Math.round(processes.reduce((sum, metric) => sum + (metric.memory?.workingSetSize || 0), 0) / 1024),
      cpuPercent: Math.round(processes.reduce((sum, metric) => sum + (metric.cpu?.percentCPUUsage || 0), 0) * 10) / 10,
      processes: processes.length,
      activeDownloads: [...liveDownloads.values()].filter((item) => !item.isPaused()).length,
    };
  });
  ipcMain.handle('settings:get', (event) => { shellState(event); return { ...nativeSettings, downloadPath: nativeSettings.downloadPath || app.getPath('downloads') }; });
  ipcMain.handle('settings:set', (event, patch) => {
    shellState(event);
    nativeSettings = { ...nativeSettings, ...validateSettingsPatch(patch) };
    writeJson('settings.json', nativeSettings);
    return { ...nativeSettings, downloadPath: nativeSettings.downloadPath || app.getPath('downloads') };
  });
  ipcMain.handle('settings:choose-folder', async (event) => {
    const state = shellState(event);
    const result = await dialog.showOpenDialog(state.win, { properties: ['openDirectory'], defaultPath: nativeSettings.downloadPath || app.getPath('downloads') });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('privacy:clear', async (event, kind) => {
    const state = shellState(event);
    if (!['cache', 'cookies', 'storage', 'all'].includes(kind)) throw new Error('Operação inválida.');
    const ses = session.fromPartition(state.partition);
    if (kind === 'cache' || kind === 'all') await ses.clearCache();
    if (kind === 'cookies' || kind === 'all') await ses.clearStorageData({ storages: ['cookies'] });
    if (kind === 'storage' || kind === 'all') await ses.clearStorageData({ storages: ['localstorage', 'indexdb', 'serviceworkers'] });
    return true;
  });
  ipcMain.handle('privacy:cookies', async (event) => {
    const state = shellState(event);
    const cookies = await session.fromPartition(state.partition).cookies.get({});
    const groups = new Map();
    for (const cookie of cookies) groups.set(cookie.domain, (groups.get(cookie.domain) || 0) + 1);
    return [...groups].map(([domain, count]) => ({ domain, count })).sort((a, b) => a.domain.localeCompare(b.domain));
  });
  ipcMain.handle('privacy:delete-cookies', async (event, domain) => {
    const state = shellState(event);
    if (typeof domain !== 'string' || domain.length > 255) return false;
    const cookieStore = session.fromPartition(state.partition).cookies;
    const cookies = await cookieStore.get({});
    for (const cookie of cookies.filter((entry) => entry.domain === domain)) {
      const host = cookie.domain.replace(/^\./, '');
      await cookieStore.remove(`${cookie.secure ? 'https' : 'http'}://${host}${cookie.path}`, cookie.name);
    }
    return true;
  });
  ipcMain.handle('updates:check', async (event) => {
    shellState(event);
    const repository = nativeSettings.releaseRepository || process.env.FORGE_RELEASES_REPO || '';
    const result = await checkLatestRelease(repository, app.isPackaged ? app.getVersion() : '1.0.0');
    latestRelease = result.url ? { url: result.url, version: result.version } : null;
    const { url, ...publicResult } = result;
    return publicResult;
  });
  ipcMain.handle('updates:open-release', async (event) => {
    shellState(event);
    if (!latestRelease?.url || !/^https:\/\/github\.com\//.test(latestRelease.url)) return false;
    await shell.openExternal(latestRelease.url);
    return true;
  });
  ipcMain.handle('system:default-apps', async (event) => {
    shellState(event);
    if (process.platform !== 'win32') return false;
    await shell.openExternal('ms-settings:defaultapps');
    return true;
  });
  ipcMain.handle('media:action', async (event, id, action) => {
    const state = shellState(event);
    const tab = state.tabs.get(id);
    if (!tab || !['pip', 'play', 'pause', 'mute', 'unmute', 'close-pip'].includes(action)) return { ok: false, message: 'Abra uma aba com vídeo primeiro.' };
    const script = `(() => {
      const video = [...document.querySelectorAll('video')].find((element) => !element.paused) || document.querySelector('video');
      if (!video) return { ok: false, message: 'Nenhum vídeo encontrado nesta página.' };
      if (${JSON.stringify(action)} === 'pip') return video.requestPictureInPicture().then(() => ({ ok: true }));
      if (${JSON.stringify(action)} === 'close-pip') return document.pictureInPictureElement ? document.exitPictureInPicture().then(() => ({ ok: true })) : { ok: false, message: 'O mini player não está aberto.' };
      if (${JSON.stringify(action)} === 'play') return video.play().then(() => ({ ok: true }));
      if (${JSON.stringify(action)} === 'pause') video.pause();
      if (${JSON.stringify(action)} === 'mute') video.muted = true;
      if (${JSON.stringify(action)} === 'unmute') video.muted = false;
      return { ok: true };
    })()`;
    try { return await tab.view.webContents.executeJavaScript(script, true); }
    catch { return { ok: false, message: 'Este site não permitiu controlar o vídeo.' }; }
  });
}

app.whenReady().then(() => {
  nativeSettings = loadNativeSettings();
  for (const record of readJson('downloads.json', [])) {
    downloads.set(record.id, { ...record, status: record.status === 'progressing' || record.status === 'paused' ? 'interrupted' : record.status });
  }
  setupSession(session.fromPartition('persist:forge-web'));
  registerIpc();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });