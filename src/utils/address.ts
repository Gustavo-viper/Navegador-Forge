import type { PageId, SearchEngine } from '../types/browser';

const searches: Record<SearchEngine, string> = {
  Google: 'https://www.google.com/search?q=',
  DuckDuckGo: 'https://duckduckgo.com/?q=',
  Bing: 'https://www.bing.com/search?q=',
};

const pages = new Set<PageId>([
  'home', 'hub', 'game-center', 'forge-games', 'studios', 'news',
  'downloads', 'bookmarks', 'history', 'wallpapers', 'profile',
  'settings', 'gamer', 'player', 'login', 'achievements', 'store',
]);

export function internalPage(value: string): PageId | null {
  const page = value.trim().toLowerCase().replace(/^forge:\/\//, '').replace(/\/$/, '') as PageId;
  return value.trim().toLowerCase().startsWith('forge://') && pages.has(page) ? page : null;
}

export function resolveForPreview(raw: string, engine: SearchEngine): string {
  const input = raw.trim();
  if (!input || input.length > 2048) throw new Error('Digite um endereço válido.');
  if (/^https?:/i.test(input)) {
    const url = new URL(input);
    if (!url.hostname) throw new Error('Endereço inválido.');
    return url.href;
  }
  const first = input.split('/')[0];
  if (!/\s/.test(input) && (/^localhost(?::\d+)?$/i.test(first) || /^(?:[\w-]+\.)+[a-z\d-]{2,}(?::\d+)?$/i.test(first) || /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/.test(first))) {
    const local = /^localhost(?::\d+)?$/i.test(first) || /^127\.0\.0\.1(?::\d+)?$/.test(first);
    return new URL(`${local ? 'http' : 'https'}://${input}`).href;
  }
  if (/^[a-z][\da-z+.-]*:/i.test(input)) throw new Error('Este protocolo não é permitido.');
  return searches[engine] + encodeURIComponent(input);
}

export function pageTitle(page: PageId): string {
  const names: Record<PageId, string> = {
    home: 'Nova aba', hub: 'Forge Hub', 'game-center': 'Game Center',
    'forge-games': 'Jogos Forge', studios: 'Forge Studios', news: 'Notícias',
    downloads: 'Downloads', bookmarks: 'Favoritos', history: 'Histórico',
    wallpapers: 'Wallpapers', profile: 'Perfil Forge', settings: 'Configurações',
    gamer: 'Gamer Mode', player: 'Forge Player', login: 'Entrar na Forge',
    achievements: 'Conquistas', store: 'Loja Forge',
  };
  return names[page];
}

export function displayHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}