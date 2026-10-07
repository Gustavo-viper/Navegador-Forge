const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'electron', 'main.cjs');
let source = fs.readFileSync(file, 'utf8');
let changed = false;

function replaceOnce(find, replace, label) {
  if (source.includes(replace.trim())) return;
  if (!source.includes(find)) {
    console.log(`Browser compatibility patch skipped: ${label}`);
    return;
  }
  source = source.replace(find, replace);
  changed = true;
}

// WhatsApp Web uses Facebook/WhatsApp infrastructure that can be mistaken for
// third-party trackers. Never apply Forge's tracker cancellation to WhatsApp's
// own domains or the page can render incompletely.
replaceOnce(
  "const trackerHosts = [\n",
  "const trackerBypassHosts = ['web.whatsapp.com', 'whatsapp.com', 'whatsapp.net'];\n\nconst trackerHosts = [\n",
  'WhatsApp tracker bypass list',
);

replaceOnce(
  "const blocked = trackerHosts.some((domain) => host === domain || host.endsWith(`.${domain}`));",
  "const trackerBypassed = trackerBypassHosts.some((domain) => host === domain || host.endsWith(`.${domain}`));\n      const blocked = !trackerBypassed && trackerHosts.some((domain) => host === domain || host.endsWith(`.${domain}`));",
  'WhatsApp tracker bypass check',
);

if (changed) fs.writeFileSync(file, source, 'utf8');
console.log(changed
  ? 'Forge Browser web compatibility patches applied.'
  : 'Forge Browser web compatibility patches already applied; nothing to change.');
