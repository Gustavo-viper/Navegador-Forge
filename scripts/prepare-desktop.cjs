const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const stage = path.join(root, 'build', 'desktop-stage');
const renderer = path.join(root, 'dist', 'index.html');
const icon = path.join(root, 'build', 'icon.ico');
if (!fs.existsSync(renderer) || !fs.existsSync(icon)) {
  throw new Error('Execute o build da interface e a geracao do icone antes de preparar o desktop.');
}

fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(path.join(stage, 'build'), { recursive: true });
fs.cpSync(path.join(root, 'dist'), path.join(stage, 'dist'), { recursive: true });
fs.cpSync(path.join(root, 'electron'), path.join(stage, 'electron'), { recursive: true });
fs.copyFileSync(icon, path.join(stage, 'build', 'icon.ico'));
fs.copyFileSync(path.join(root, 'build', 'installer.nsh'), path.join(stage, 'build', 'installer.nsh'));
fs.copyFileSync(path.join(root, 'electron-builder.yml'), path.join(stage, 'electron-builder.yml'));

// A clean runtime manifest avoids shipping Vite/build tooling with the browser.
fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify({
  name: 'forge-browser',
  version: '1.0.0',
  main: 'electron/main.cjs',
  description: 'Forge Browser by Forge Studios',
  author: 'Forge Studios',
  private: true,
  dependencies: {},
}, null, 2));
console.log('Desktop package ready: build/desktop-stage');