const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'electron', 'main.cjs');
let source = fs.readFileSync(file, 'utf8');
let changed = false;

function replaceOnce(find, replace, label) {
  if (source.includes(replace.trim())) return;
  if (!source.includes(find)) {
    console.log(`Performance patch skipped: ${label}`);
    return;
  }
  source = source.replace(find, replace);
  changed = true;
}

replaceOnce(
  "const { app, BrowserWindow, WebContentsView, ipcMain, session, dialog, shell } = require('electron');",
  "const { app, BrowserWindow, WebContentsView, ipcMain, session, dialog, shell, Menu } = require('electron');",
  'Menu import'
);

replaceOnce(
  "app.setName('Forge Browser');\n",
  "app.setName('Forge Browser');\n// Forge Turbo: keep Chromium on the GPU/network fast path while retaining Chromium safety.\napp.commandLine.appendSwitch('enable-gpu-rasterization');\napp.commandLine.appendSwitch('enable-zero-copy');\napp.commandLine.appendSwitch('enable-native-gpu-memory-buffers');\napp.commandLine.appendSwitch('enable-quic');\napp.commandLine.appendSwitch('enable-features', 'CalculateNativeWinOcclusion,IntensiveWakeUpThrottling,BackForwardCache');\n",
  'turbo Chromium flags'
);

replaceOnce(
  "app.setName('Forge Browser');\n",
  "app.setName('Forge Browser');\n// Avoid Electron's default menu when the Forge UI provides its own controls.\nMenu.setApplicationMenu(null);\n",
  'application menu'
);

const updaterImport = "const { setupAutoUpdater } = require('./auto-updater.cjs');";
const updaterFullImport = "const { setupAutoUpdater, checkForUpdates, installUpdate } = require('./auto-updater.cjs');";
if (source.includes(updaterImport) && !source.includes(updaterFullImport)) {
  source = source.replace(updaterImport, updaterFullImport);
  changed = true;
} else if (!source.includes(updaterFullImport)) {
  replaceOnce(
    "const { checkLatestRelease } = require('./updates.cjs');",
    "const { checkLatestRelease } = require('./updates.cjs');\n" + updaterFullImport,
    'automatic updater import'
  );
}

const trackerBlock = /const trackerHosts = new Set\(\[\n([\s\S]*?)\n\]\);/;
if (trackerBlock.test(source)) {
  source = source.replace(trackerBlock, 'const trackerHosts = [\n$1\n];');
  changed = true;
} else {
  const brokenTrackerBlock = /const trackerHosts = \[\n([\s\S]*?)\n\]\);/;
  if (brokenTrackerBlock.test(source)) {
    source = source.replace(brokenTrackerBlock, 'const trackerHosts = [\n$1\n];');
    changed = true;
  }
}

replaceOnce(
  "  'hotjar.com', 'segment.io', 'mixpanel.com', 'adsrvr.org',\n]);",
  "  'hotjar.com', 'segment.io', 'mixpanel.com', 'adsrvr.org',\n];",
  'tracker list closing fallback'
);

replaceOnce(
  "const blocked = [...trackerHosts].some((domain) => host === domain || host.endsWith(`.${domain}`));",
  "const blocked = trackerHosts.some((domain) => host === domain || host.endsWith(`.${domain}`));",
  'tracker request allocation'
);

replaceOnce(
`function showActiveView(state) {
  for (const [id, tab] of state.tabs) {
    const active = id === state.activeId && !tab.error;
    tab.view.setVisible(active);
    if (active) {
      tab.view.setBounds(contentBounds(state));
      state.win.contentView.addChildView(tab.view);
    }
  }
}`,
`function showActiveView(state) {
  const activeTab = state.activeId ? state.tabs.get(state.activeId) : null;
  const previousTab = state.renderedActiveId ? state.tabs.get(state.renderedActiveId) : null;

  if (previousTab && previousTab !== activeTab) previousTab.view.setVisible(false);

  if (!activeTab || activeTab.error) {
    state.renderedActiveId = null;
    return;
  }

  activeTab.view.setBounds(contentBounds(state));
  if (state.renderedActiveId !== activeTab.id) {
    state.win.contentView.addChildView(activeTab.view);
    state.renderedActiveId = activeTab.id;
  }
  activeTab.view.setVisible(true);
}`,
  'active view rendering'
);

replaceOnce(
  "const state = { win, privateMode, partition, tabs: new Map(), activeId: null, bounds: null };",
  "const state = { win, privateMode, partition, tabs: new Map(), activeId: null, renderedActiveId: null, bounds: null, layoutTimer: null };",
  'window performance state'
);

replaceOnce(
  "win.on('resize', () => showActiveView(state));",
  "win.on('resize', () => {\n    if (state.layoutTimer) return;\n    state.layoutTimer = setTimeout(() => {\n      state.layoutTimer = null;\n      showActiveView(state);\n    }, 16);\n  });",
  'resize throttling'
);

replaceOnce(
  "  view.setBackgroundColor('#f9f9f9');\n  view.setVisible(false);",
  "  view.setBackgroundColor('#f9f9f9');\n  // Keep background tabs throttled so Turbo prioritizes the active page/video.\n  view.webContents.setBackgroundThrottling(true);\n  view.setVisible(false);",
  'background throttling'
);

replaceOnce(
`  ipcMain.handle('updates:open-release', async (event) => {
    shellState(event);
    if (!latestRelease?.url || !/^https:\/\/github\.com\//.test(latestRelease.url)) return false;
    await shell.openExternal(latestRelease.url);
    return true;
  });`,
`  ipcMain.handle('updates:open-release', async (event) => {
    shellState(event);
    if (!latestRelease?.url || !/^https:\/\/github\.com\//.test(latestRelease.url)) return false;
    await shell.openExternal(latestRelease.url);
    return true;
  });
  ipcMain.handle('updates:auto-check', (event) => {
    shellState(event);
    return checkForUpdates();
  });
  ipcMain.handle('updates:install', (event) => {
    shellState(event);
    return installUpdate();
  });`,
  'automatic update IPC'
);

replaceOnce(
`  registerIpc();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });`,
`  registerIpc();
  createWindow();
  setupAutoUpdater();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });`,
  'automatic updater startup'
);

if (changed) fs.writeFileSync(file, source, 'utf8');
console.log(changed
  ? 'Forge Browser Turbo performance, navigation and media optimizations applied safely.'
  : 'Forge Browser performance optimizations already applied; nothing to change.');
