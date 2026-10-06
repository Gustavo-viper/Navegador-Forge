export type PageId =
  | 'home' | 'hub' | 'game-center' | 'forge-games' | 'studios' | 'news'
  | 'downloads' | 'bookmarks' | 'history' | 'wallpapers' | 'profile'
  | 'settings' | 'gamer' | 'player' | 'login' | 'achievements' | 'store';

export type ThemeId = 'dark' | 'neon' | 'cyber' | 'minimal';
export type SearchEngine = 'Google' | 'DuckDuckGo' | 'Bing';
export type LoadError = 'not-found' | 'connection' | 'certificate' | 'blocked' | 'loading';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  page: PageId | null;
  private: boolean;
  pinned: boolean;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  security: 'secure' | 'insecure' | 'internal';
  error: LoadError | null;
  previousPage?: PageId;
  previousUrl?: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folderId: string | null;
  createdAt: number;
}

export interface BookmarkFolder { id: string; name: string; }
export interface HistoryEntry { id: string; title: string; url: string; visitedAt: number; }
export interface QuickLink { id: string; label: string; url: string; icon: string; }

export interface AppearanceSettings {
  theme: ThemeId;
  wallpaper: 'ember' | 'noir' | 'grid' | 'custom';
  customWallpaper: string;
  sidebarExpanded: boolean;
  sidebarPosition: 'left' | 'right';
  bookmarksBar: boolean;
  animations: boolean;
  sounds: boolean;
  iconStyle: 'outline' | 'bold';
  transparency: number;
  homePage: 'home' | 'hub';
  startup: 'new-tab' | 'restore';
  searchEngine: SearchEngine;
  newTabPosition: 'next' | 'end';
  gameCenterUrl: string;
}

export interface NativeSettings {
  downloadPath: string;
  askDownloadLocation: boolean;
  blockPopups: boolean;
  blockNotifications: boolean;
  blockTrackers: boolean;
  sitePermissions: Record<string, boolean>;
  releaseRepository: string;
}

export interface DownloadRecord {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  speed: number;
  status: 'progressing' | 'paused' | 'completed' | 'cancelled' | 'interrupted';
  path: string;
  startedAt: number;
  private: boolean;
  windowId: number;
}

export interface TabStateEvent {
  tabId: string;
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  security: 'secure' | 'insecure';
  error: LoadError | null;
  navigated?: boolean;
}

export interface SystemMetrics {
  ramMB: number;
  cpuPercent: number;
  processes: number;
  activeDownloads: number;
}

export interface UpdateResult {
  status: 'unconfigured' | 'current' | 'available' | 'error';
  version?: string;
  current?: string;
  message?: string;
}

export interface ForgeBridge {
  isDesktop: true;
  getEnvironment(): Promise<{ privateMode: boolean; version: string; platform: string }>;
  navigate(tabId: string, address: string, engine: SearchEngine, privateTab?: boolean, background?: boolean): Promise<{ url: string }>;
  activateTab(tabId: string | null): Promise<boolean>;
  closeTab(tabId: string): Promise<boolean>;
  tabAction(tabId: string, action: 'back' | 'forward' | 'reload' | 'stop'): Promise<boolean>;
  setContentBounds(bounds: { x: number; y: number; width: number; height: number }): void;
  newPrivateWindow(): Promise<boolean>;
  windowAction(action: 'minimize' | 'maximize' | 'close'): Promise<boolean>;
  getDownloads(): Promise<DownloadRecord[]>;
  downloadAction(id: string, action: 'pause' | 'resume' | 'cancel' | 'open' | 'folder'): Promise<boolean | string>;
  openDownloadFolder(): Promise<string>;
  getMetrics(): Promise<SystemMetrics>;
  getNativeSettings(): Promise<NativeSettings>;
  setNativeSettings(patch: Partial<NativeSettings>): Promise<NativeSettings>;
  chooseDownloadFolder(): Promise<string | null>;
  clearBrowsingData(kind: 'cache' | 'cookies' | 'storage' | 'all'): Promise<boolean>;
  listCookies(): Promise<{ domain: string; count: number }[]>;
  deleteCookiesForDomain(domain: string): Promise<boolean>;
  checkForUpdates(): Promise<UpdateResult>;
  openRelease(): Promise<boolean>;
  openDefaultApps(): Promise<boolean>;
  mediaAction(tabId: string, action: 'pip' | 'play' | 'pause' | 'mute' | 'unmute' | 'close-pip'): Promise<{ ok: boolean; message?: string }>;
  onTabState(callback: (event: TabStateEvent) => void): () => void;
  onOpenTab(callback: (event: { url: string; background: boolean; private: boolean }) => void): () => void;
  onDownload(callback: (record: DownloadRecord) => void): () => void;
  onShortcut(callback: (shortcut: string) => void): () => void;
  onWindowState(callback: (state: { maximized: boolean }) => void): () => void;
}

declare global {
  interface Window { forge?: ForgeBridge; }
}