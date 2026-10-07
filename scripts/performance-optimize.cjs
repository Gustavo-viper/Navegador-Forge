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
  "app.setName('Forge Browser');\n// Avoid Electron's default menu when the Forge UI provides its own controls.\nMenu.setApplicationMenu(null);\n",
  'application menu'
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
  "  view.setBackgroundColor('#f9f9f9');\n  // Allow Chromium to throttle timers and animations for inactive tabs.\n  view.webContents.setBackgroundThrottling(true);\n  view.setVisible(false);",
  'background throttling'
);

if (changed) fs.writeFileSync(file, source, 'utf8');
console.log(changed
  ? 'Forge Browser performance optimizations applied.'
  : 'Forge Browser performance optimizations already applied; nothing to change.');
