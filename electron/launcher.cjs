const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');

// WhatsApp Web and several modern web apps reject Electron's default user-agent.
// Present the Chromium engine version actually bundled by Forge Browser so sites
// see a normal Chromium/Chrome-compatible browser instead of an Electron client.
const chromeVersion = process.versions.chrome || '134.0.0.0';
app.commandLine.appendSwitch(
  'user-agent',
  `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
);

function toggleFullscreen(win) {
  if (!win || win.isDestroyed()) return false;
  win.setFullScreen(!win.isFullScreen());
  return win.isFullScreen();
}

ipcMain.handle('fullscreen:toggle', (event) => toggleFullscreen(BrowserWindow.fromWebContents(event.sender)));
ipcMain.handle('fullscreen:set', (event, enabled) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return false;
  win.setFullScreen(Boolean(enabled));
  return win.isFullScreen();
});
ipcMain.handle('fullscreen:state', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return Boolean(win && !win.isDestroyed() && win.isFullScreen());
});

app.whenReady().then(() => {
  globalShortcut.register('F11', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) toggleFullscreen(win);
  });
  globalShortcut.register('Escape', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win?.isFullScreen()) win.setFullScreen(false);
  });
});

require('./main.cjs');
