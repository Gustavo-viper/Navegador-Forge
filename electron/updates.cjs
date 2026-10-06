function compareVersions(latest, installed) {
  const left = latest.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const right = installed.split('.').map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    if ((left[index] || 0) > (right[index] || 0)) return 1;
    if ((left[index] || 0) < (right[index] || 0)) return -1;
  }
  return 0;
}

async function checkLatestRelease(repository, installedVersion) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) return { status: 'unconfigured' };
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Forge-Browser' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    const release = await response.json();
    const version = String(release.tag_name || '').replace(/^v/i, '').split('-')[0];
    if (!/^\d+\.\d+\.\d+$/.test(version) || !/^https:\/\/github\.com\//.test(release.html_url || '')) {
      throw new Error('A release não possui versão ou URL válida.');
    }
    return {
      status: compareVersions(version, installedVersion) > 0 ? 'available' : 'current',
      version, current: installedVersion, url: release.html_url,
    };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

module.exports = { checkLatestRelease };