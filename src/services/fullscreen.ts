const BUTTON_ID = 'forge-fullscreen-toggle';

function isFullscreen() {
  return Boolean(document.fullscreenElement);
}

async function toggleFullscreen() {
  try {
    if (isFullscreen()) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    // Chromium/Electron may reject fullscreen while the window is not focused.
  }
}

function updateButton(button: HTMLButtonElement) {
  const active = isFullscreen();
  button.textContent = active ? '⛶' : '⛶';
  button.title = active ? 'Sair da tela cheia (F11)' : 'Tela cheia (F11)';
  button.setAttribute('aria-label', button.title);
  button.dataset.active = String(active);
}

function mount() {
  if (document.getElementById(BUTTON_ID)) return;
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.className = 'forge-fullscreen-button no-drag';
  button.addEventListener('click', () => void toggleFullscreen());
  document.addEventListener('fullscreenchange', () => updateButton(button));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'F11') {
      event.preventDefault();
      void toggleFullscreen();
    }
    if (event.key === 'Escape' && isFullscreen()) {
      void document.exitFullscreen().catch(() => {});
    }
  });
  document.body.appendChild(button);
  updateButton(button);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
else mount();
