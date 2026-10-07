const BUTTON_ID = 'forge-fullscreen-toggle';

type FullscreenBridge = {
  fullscreenToggle?: () => Promise<boolean>;
  fullscreenSet?: (enabled: boolean) => Promise<boolean>;
  fullscreenState?: () => Promise<boolean>;
};

function bridge(): FullscreenBridge | undefined {
  return (window as Window & { forge?: FullscreenBridge }).forge;
}

let nativeFullscreen = false;

async function readState() {
  try {
    nativeFullscreen = Boolean(await bridge()?.fullscreenState?.());
  } catch {
    nativeFullscreen = Boolean(document.fullscreenElement);
  }
}

async function toggleFullscreen() {
  try {
    if (bridge()?.fullscreenToggle) {
      nativeFullscreen = Boolean(await bridge().fullscreenToggle!());
      return;
    }
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    // Fallback for non-desktop preview builds.
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Ignore when Chromium rejects the request. */ }
  }
}

function updateButton(button: HTMLButtonElement) {
  const active = nativeFullscreen || Boolean(document.fullscreenElement);
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
  button.addEventListener('click', () => void toggleFullscreen().finally(() => updateButton(button)));
  document.addEventListener('fullscreenchange', () => updateButton(button));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'F11') {
      event.preventDefault();
      void toggleFullscreen().finally(() => updateButton(button));
    }
    if (event.key === 'Escape' && (nativeFullscreen || document.fullscreenElement)) {
      event.preventDefault();
      void (bridge()?.fullscreenSet ? bridge().fullscreenSet!(false) : document.exitFullscreen()).finally(() => {
        nativeFullscreen = false;
        updateButton(button);
      });
    }
  });
  document.body.appendChild(button);
  void readState().finally(() => updateButton(button));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
else mount();
