const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'electron', 'main.cjs');
let source = fs.readFileSync(file, 'utf8');

function replaceOnce(find, replace, label) {
  if (!source.includes(find)) {
    if (source.includes(replace.trim())) return;
    throw new Error(`Performance patch not found: ${label}`);
  }
  source = source.replace(find, replace);
}

replaceOnce(
  "const { app, BrowserWindow, WebContentsView, ipcMain, session, dialog, shell } = require('electron');",
  "const { app, BrowserWindow, WebContentsView, ipcMain, session, dialog, shell, Menu } = require('electron');",
  'Menu import'
);

replaceOnce(
  "app.setName('Forge Browser');\n",
  "app.setName('Forge Browser');\n// Do not build Electron's default application menu when the Forge UI supplies its own controls.\nMenu.setApplicationMenu(null);\n",
  'application menu'
);

replaceOnce(
`function showActiveView(state) {\n  for (const [id, tab] of state.tabs) {\n    const active = id === state.activeId && !tab.error;\n    tab.view.setVisible(active);\n    if (active) {\n      tab.view.setBounds(contentBounds(state));\n      state.win.contentView.addChildView(tab.view);\n    }\n  }\n}`,
`function showActiveView(state) {\n  const activeTab = state.activeId ? state.tabs.get(state.activeId) : null;\n  const previousTab = state.renderedActiveId ? state.tabs.get(state.renderedActiveId) : null;\n\n  if (previousTab && previousTab !== activeTab) previousTab.view.setVisible(false);\n\n  if (!activeTab || activeTab.error) {\n    state.renderedActiveId = null;\n    return;\n  }\n\n  activeTab.view.setBounds(contentBounds(state));\n  if (state.renderedActiveId !== activeTab.id) {\n    state.win.contentView.addChildView(activeTab.view);\n    state.renderedActiveId = activeTab.id;\n  }\n  activeTab.view.setVisible(true);\n}`,
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
  "  view.setBackgroundColor('#f9f9f9');\n  // Let Chromium throttle timers/animations for inactive tabs.\n  view.webContents.setBackgroundThrottling(true);\n  view.setVisible(false);",
  'background throttling'
);

fs.writeFileSync(file, source, 'utf8');
console.log('Forge Browser performance optimizations applied.');
