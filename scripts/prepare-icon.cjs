const fs = require('node:fs');
const path = require('node:path');

const source = path.join(__dirname, '..', 'public', 'icons', 'forge-app.png');
const buildDir = path.join(__dirname, '..', 'build');
const target = path.join(buildDir, 'icon.png');

if (!fs.existsSync(source)) {
  throw new Error(`Forge icon not found: ${source}`);
}

fs.mkdirSync(buildDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(`Forge Browser icon prepared: ${target}`);
