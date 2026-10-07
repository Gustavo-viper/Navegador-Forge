const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');

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
