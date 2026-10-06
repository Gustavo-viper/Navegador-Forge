const fs = require('node:fs');
const path = require('node:path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const sourcePath = path.join(__dirname, '..', 'public', 'icons', 'forge-app.png');
const sourceBytes = fs.readFileSync(sourcePath);
const isJpeg = sourceBytes[0] === 0xff && sourceBytes[1] === 0xd8;
const source = isJpeg ? jpeg.decode(sourceBytes, { useTArray: true }) : PNG.sync.read(sourceBytes);

function resize(size) {
  const output = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fromX = Math.min(source.width - 1, Math.floor(x * source.width / size));
      const fromY = Math.min(source.height - 1, Math.floor(y * source.height / size));
      const from = (fromY * source.width + fromX) * 4;
      const to = (y * size + x) * 4;
      for (let channel = 0; channel < 4; channel++) output.data[to + channel] = source.data[from + channel];
    }
  }
  return PNG.sync.write(output);
}

// The artwork source may be JPEG. Normalize it before Chromium and Windows consume it.
if (isJpeg) fs.writeFileSync(sourcePath, resize(512));

const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = sizes.map(resize);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(size === 256 ? 0 : size, entry);
  header.writeUInt8(size === 256 ? 0 : size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[index].length;
});
const outputDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'icon.ico'), Buffer.concat([header, ...images]));
console.log('Forge icon ready: build/icon.ico');