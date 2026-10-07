const { app, autoUpdater, dialog, BrowserWindow } = require('electron');

const OWNER = 'Gustavo-viper';
const REPO = 'Navegador-Forge';
let initialized = false;
let checking = false;

function sendToWindows(channel, payload) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
}

function setupAutoUpdater() {
  if (initialized || !app.isPackaged || process.platform !== 'win32') return;
  initialized = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.fullChangelog = false;
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: OWNER,
    repo: REPO,
    private: false,
    releaseType: 'release',
  });

  autoUpdater.on('checking-for-update', () => {
    checking = true;
    sendToWindows('updates:state', { status: 'checking', current: app.getVersion() });
  });

  autoUpdater.on('update-available', (info) => {
    checking = false;
    sendToWindows('updates:state', {
      status: 'available',
      current: app.getVersion(),
      version: info.version,
    });
  });

  autoUpdater.on('update-not-available', () => {
    checking = false;
    sendToWindows('updates:state', { status: 'current', current: app.getVersion() });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendToWindows('updates:state', {
      status: 'downloading',
      current: app.getVersion(),
      version: progress.version || null,
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', async (info) => {
    checking = false;
    sendToWindows('updates:state', {
      status: 'downloaded',
      current: app.getVersion(),
      version: info.version,
    });

    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Forge Browser — Atualização pronta',
      message: `A versão ${info.version} do Forge Browser está pronta para instalar.`,
      detail: 'A atualização foi baixada em segundo plano. Reinicie o Forge Browser para aplicar a nova versão.',
      buttons: ['Reiniciar e atualizar', 'Depois'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      setTimeout(() => autoUpdater.quitAndInstall(false, true), 100);
    }
  });

  autoUpdater.on('error', (error) => {
    checking = false;
    sendToWindows('updates:state', { status: 'error', message: error?.message || 'Falha ao atualizar.' });
  });

  setTimeout(() => checkForUpdates(), 12000);
  setInterval(() => checkForUpdates(), 6 * 60 * 60 * 1000);
}

async function checkForUpdates() {
  if (!initialized || checking || !app.isPackaged || process.platform !== 'win32') return { status: 'disabled' };
  try {
    checking = true;
    await autoUpdater.checkForUpdates();
    return { status: 'checking' };
  } catch (error) {
    checking = false;
    sendToWindows('updates:state', { status: 'error', message: error?.message || 'Falha ao verificar atualizações.' });
    return { status: 'error', message: error?.message || 'Falha ao verificar atualizações.' };
  }
}

function installUpdate() {
  if (!initialized || !app.isPackaged) return false;
  autoUpdater.quitAndInstall(false, true);
  return true;
}

module.exports = { setupAutoUpdater, checkForUpdates, installUpdate };