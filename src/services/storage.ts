import type { AppearanceSettings, Bookmark, BookmarkFolder, BrowserTab, HistoryEntry, QuickLink } from '../types/browser';

export const defaultSettings: AppearanceSettings = {
  theme: 'dark', wallpaper: 'ember', customWallpaper: '', sidebarExpanded: false,
  sidebarPosition: 'left', bookmarksBar: false, animations: true, sounds: false, iconStyle: 'outline',
  transparency: 88, homePage: 'home', startup: 'new-tab', searchEngine: 'Google',
  newTabPosition: 'end', gameCenterUrl: '',
};

export const defaultLinks: QuickLink[] = [
  { id: 'game-center', label: 'Game Center', url: 'forge://game-center', icon: 'gamepad' },
  { id: 'studios', label: 'Forge Studios', url: 'forge://studios', icon: 'forge' },
  { id: 'games', label: 'Jogos Forge', url: 'forge://forge-games', icon: 'joystick' },
  { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com', icon: 'youtube' },
  { id: 'google', label: 'Google', url: 'https://www.google.com', icon: 'google' },
  { id: 'github', label: 'GitHub', url: 'https://github.com', icon: 'github' },
];

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`forge.v1.${key}`);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

export function writeStored(key: string, value: unknown) {
  try { localStorage.setItem(`forge.v1.${key}`, JSON.stringify(value)); }
  catch { /* Storage may be disabled or full; the session remains usable. */ }
}

export interface SavedSession { tabs: Pick<BrowserTab, 'url' | 'title' | 'page' | 'pinned'>[]; activeIndex: number; }

export interface BrowserLibrary {
  bookmarks: Bookmark[];
  folders: BookmarkFolder[];
  history: HistoryEntry[];
  links: QuickLink[];
}