const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

const nativeDefaults = {
  downloadPath: '',
  askDownloadLocation: false,
  blockPopups: true,
  blockNotifications: true,
  blockTrackers: true,
  sitePermissions: {},
  releaseRepository: '',
};

function filePath(name) {
  return path.join(app.getPath('userData'), name);
}

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath(name), 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(name, value) {
  const destination = filePath(name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, destination);
}

function loadNativeSettings() {
  const saved = readJson('settings.json', {});
  return { ...nativeDefaults, ...saved, sitePermissions: saved.sitePermissions || {} };
}

function validateSettingsPatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Configuração inválida.');
  const result = {};
  if ('downloadPath' in patch) {
    if (typeof patch.downloadPath !== 'string' || patch.downloadPath.length > 500) throw new Error('Pasta inválida.');
    result.downloadPath = patch.downloadPath;
  }
  for (const key of ['askDownloadLocation', 'blockPopups', 'blockNotifications', 'blockTrackers']) {
    if (key in patch) {
      if (typeof patch[key] !== 'boolean') throw new Error('Valor inválido.');
      result[key] = patch[key];
    }
  }
  if ('releaseRepository' in patch) {
    const value = patch.releaseRepository.trim();
    if (value && !/^[\w.-]+\/[\w.-]+$/.test(value)) throw new Error('Use owner/repository.');
    result.releaseRepository = value;
  }
  if ('sitePermissions' in patch) {
    const permissions = patch.sitePermissions;
    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions) || Object.keys(permissions).length > 100) {
      throw new Error('Permissões inválidas.');
    }
    for (const [key, allowed] of Object.entries(permissions)) {
      if (!/^https:\/\/[^\s/]+\|(notifications|media|geolocation)$/.test(key) || typeof allowed !== 'boolean') {
        throw new Error('Permissão de site inválida.');
      }
    }
    result.sitePermissions = permissions;
  }
  return result;
}

module.exports = { readJson, writeJson, loadNativeSettings, validateSettingsPatch };