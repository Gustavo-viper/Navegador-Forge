import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CircleAlert, Clock3, Cpu, Download,
  Ellipsis, Gamepad2, Globe2, House, LockKeyhole, Maximize2, Menu, Minus,
  PanelLeftClose, Palette, PictureInPicture2, Plus, RotateCw, Settings2,
  ShieldAlert, ShieldCheck, SlidersHorizontal, Star, UserRound, X,
} from 'lucide-react';
import { ForgeMark, ForgeWordmark } from './components/ForgeLogo';
import { Button, IconButton, Input, Modal } from './components/ui';
import HomePage from './pages/HomePage';
import { BookmarksPage, DownloadsPage, HistoryPage, WallpapersPage } from './pages/LibraryPages';
import { EditorialPage, GameCenterPage, GamerPage, HubPage, LoginPage, PlayerPage, ProfilePage } from './pages/ForgePages';
import { SettingsPage } from './pages/SettingsPage';
import { forgeAccount } from './services/forgeAccount';
import { defaultLinks, defaultSettings, readStored, writeStored, type SavedSession } from './services/storage';
import type {
  AppearanceSettings, Bookmark as BookmarkItem, BookmarkFolder, BrowserTab,
  DownloadRecord, HistoryEntry, LoadError, NativeSettings, PageId, QuickLink,
  TabStateEvent, UpdateResult,
} from './types/browser';
import { displayHost, internalPage, pageTitle, resolveForPreview } from './utils/address';

const defaultNative: NativeSettings = {
  downloadPath: '', askDownloadLocation: false, blockPopups: true,
  blockNotifications: true, blockTrackers: true, sitePermissions: {}, releaseRepository: '',
};

function makeTab(page: PageId | null = 'home', options: Partial<BrowserTab> = {}): BrowserTab {
  return {
    id: crypto.randomUUID(), title: page ? pageTitle(page) : 'Nova aba',
    url: page ? `forge://${page}` : '', page, private: false, pinned: false,
    loading: false, canGoBack: false, canGoForward: false,
    security: page ? 'internal' : 'insecure', error: null, ...options,
  };
}

function getInitialSession(settings: AppearanceSettings) {
  const saved = readStored<SavedSession | null>('session', null);
  if (settings.startup === 'restore' && saved?.tabs?.length) {
    const tabs = saved.tabs.slice(0, 24).filter((tab) => tab.page || /^https?:\/\//.test(tab.url)).map((tab) => makeTab(tab.page, { url: tab.url, title: tab.title, pinned: tab.pinned }));
    if (tabs.length) return { tabs, activeId: tabs[Math.min(saved.activeIndex || 0, tabs.length - 1)].id };
  }
  const first = makeTab(settings.homePage);
  return { tabs: [first], activeId: first.id };
}

const sidebarItems: { page: PageId; label: string; icon: typeof House }[] = [
  { page: 'home', label: 'Início', icon: House },
  { page: 'hub', label: 'Forge Hub', icon: Gamepad2 },
  { page: 'game-center', label: 'Game Center', icon: SlidersHorizontal },
  { page: 'downloads', label: 'Downloads', icon: Download },
  { page: 'bookmarks', label: 'Favoritos', icon: Star },
  { page: 'history', label: 'Histórico', icon: Clock3 },
  { page: 'wallpapers', label: 'Wallpapers', icon: Palette },
  { page: 'profile', label: 'Perfil', icon: UserRound },
  { page: 'settings', label: 'Configurações', icon: Settings2 },
];

const errorCopy: Record<LoadError, { title: string; message: string }> = {
  'not-found': { title: 'Site não encontrado.', message: 'Confira se o endereço está correto e tente novamente.' },
  connection: { title: 'Falha de conexão.', message: 'Não foi possível se conectar. Verifique sua conexão com a internet.' },
  certificate: { title: 'Certificado inválido.', message: 'A conexão com este site não pôde ser verificada. Por segurança, a página não foi aberta.' },
  blocked: { title: 'Página bloqueada.', message: 'O acesso a este conteúdo foi bloqueado pelo navegador.' },
  loading: { title: 'Não foi possível carregar esta página.', message: 'O site pode estar indisponível no momento. Tente novamente.' },
};

function playTabSound() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = 510;
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.07);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + 0.07);
    oscillator.onended = () => void context.close();
  } catch { /* Audio feedback is optional. */ }
}

export default function App() {
  const [settings, setSettings] = useState<AppearanceSettings>(() => ({ ...defaultSettings, ...readStored('appearance', {}) }));
  const initial = useRef<ReturnType<typeof getInitialSession> | null>(null);
  if (!initial.current) initial.current = getInitialSession(settings);
  const [tabs, setTabs] = useState<BrowserTab[]>(initial.current.tabs);
  const [activeId, setActiveId] = useState(initial.current.activeId);
  const tabsRef = useRef(tabs);
  const activeRef = useRef(activeId);
  const loadedTabs = useRef(new Set<string>());
  const closedTabs = useRef<BrowserTab[]>([]);
  const privateRef = useRef(false);
  const actionsRef = useRef<{ openPopup: (event: { url: string; background: boolean; private: boolean }) => void; shortcut: (value: string) => void }>({ openPopup: () => {}, shortcut: () => {} });

  const [address, setAddress] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => readStored('bookmarks', []));
  const [folders, setFolders] = useState<BookmarkFolder[]>(() => readStored('folders', []));
  const [history, setHistory] = useState<HistoryEntry[]>(() => readStored('history', []));
  const [links, setLinks] = useState<QuickLink[]>(() => readStored('links', defaultLinks));
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [native, setNative] = useState<NativeSettings>(defaultNative);
  const [privateWindow, setPrivateWindow] = useState(false);
  const [version, setVersion] = useState('1.0.0 / WEB');
  const [user, setUser] = useState<User | null>(null);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  const [toast, setToast] = useState('');
  const [maximized, setMaximized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [tabMenu, setTabMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [quickDialog, setQuickDialog] = useState<QuickLink | 'new' | null>(null);
  const [quickName, setQuickName] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickError, setQuickError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; text: string; action: () => void } | null>(null);
  const [pageRefresh, setPageRefresh] = useState(0);
  const [settingsCategory, setSettingsCategory] = useState<'general' | 'forge'>('general');
  const addressRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  const active = tabs.find((tab) => tab.id === activeId) || tabs[0];
  const canGoBack = Boolean(active && (active.canGoBack || active.previousUrl || (active.previousPage && active.previousPage !== active.page) || (active.page && active.page !== 'home')));
  const starred = Boolean(active && bookmarks.some((bookmark) => bookmark.url === active.url));
  const lastExternal = [...tabs].reverse().find((tab) => !tab.page && /^https?:\/\//.test(tab.url));

  function mutateTabs(update: (current: BrowserTab[]) => BrowserTab[]) {
    const next = update(tabsRef.current);
    tabsRef.current = next;
    setTabs(next);
  }
  function activate(id: string) { activeRef.current = id; setActiveId(id); }
  function notify(message: string) { setToast(message); }
  function onSettings(patch: Partial<AppearanceSettings>) { setSettings((current) => ({ ...current, ...patch })); }
  function openSettings(category: 'general' | 'forge' = 'general') { setSettingsCategory(category); openPage('settings'); }

  async function onNative(patch: Partial<NativeSettings>) {
    if (!window.forge) { notify('Este controle está disponível no aplicativo desktop.'); return; }
    try { setNative(await window.forge.setNativeSettings(patch)); notify('Preferência salva.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Não foi possível salvar a preferência.'); }
  }

  function insertTab(tab: BrowserTab) {
    const currentId = activeRef.current;
    mutateTabs((current) => {
      if (settings.newTabPosition === 'next') {
        const index = current.findIndex((item) => item.id === currentId);
        return [...current.slice(0, index + 1), tab, ...current.slice(index + 1)];
      }
      return [...current, tab];
    });
    if (settings.sounds) playTabSound();
  }

  function openPage(page: PageId, inNewTab = false) {
    if (inNewTab || !tabsRef.current.length) {
      const tab = makeTab(page, { private: privateRef.current });
      insertTab(tab); activate(tab.id);
    } else {
      const id = activeRef.current;
      mutateTabs((current) => current.map((tab) => tab.id === id ? {
        ...tab, previousPage: tab.page && tab.page !== page ? tab.page : tab.previousPage,
        previousUrl: tab.page ? tab.previousUrl : tab.url,
        page, url: `forge://${page}`, title: pageTitle(page), loading: false,
        security: 'internal', error: null,
        canGoBack: Boolean(tab.page && tab.page !== page) || Boolean(tab.url && !tab.page), canGoForward: false,
      } : tab));
    }
    window.forge?.activateTab(null).catch(() => {});
    setMenuOpen(false); setSecurityOpen(false);
  }

  function newTab(privateTab = false) {
    if (privateTab && !window.forge) { notify('Abas privadas exigem o aplicativo desktop.'); return; }
    const tab = makeTab(settings.homePage, { private: privateTab || privateRef.current });
    insertTab(tab); activate(tab.id); window.forge?.activateTab(null).catch(() => {});
    setMenuOpen(false);
  }

  function openAddress(raw: string, options: { newTab?: boolean; background?: boolean; private?: boolean; targetId?: string } = {}) {
    const value = raw.trim(); if (!value) return;
    const internal = internalPage(value);
    if (internal) {
      if (options.newTab) {
        const tab = makeTab(internal, { private: options.private ?? privateRef.current });
        insertTab(tab); if (!options.background) { activate(tab.id); window.forge?.activateTab(null).catch(() => {}); }
      } else openPage(internal);
      return;
    }
    if (value.startsWith('forge://')) { notify('Esta página Forge não existe.'); return; }
    let url: string;
    try { url = resolveForPreview(value, settings.searchEngine); }
    catch (error) { notify(error instanceof Error ? error.message : 'Endereço inválido.'); return; }

    let target = tabsRef.current.find((tab) => tab.id === (options.targetId || activeRef.current));
    if (options.newTab || !target) {
      target = makeTab(null, { private: options.private ?? privateRef.current });
      insertTab(target);
    }
    const tab = target;
    const title = displayHost(url) || 'Carregando...';
    mutateTabs((current) => current.map((item) => item.id === tab.id ? {
      ...item, previousPage: item.page || item.previousPage, page: null, url, title,
      loading: Boolean(window.forge), error: null, security: url.startsWith('https://') ? 'secure' : 'insecure',
    } : item));
    if (!options.background) activate(tab.id);

    if (window.forge) {
      loadedTabs.current.add(tab.id);
      window.forge.navigate(tab.id, value, settings.searchEngine, tab.private, options.background)
        .catch((error) => {
          mutateTabs((current) => current.map((item) => item.id === tab.id ? { ...item, loading: false, error: 'loading' } : item));
          notify(error instanceof Error ? error.message : 'Não foi possível abrir a página.');
        });
    } else {
      if (!options.background) window.open(url, '_blank', 'noopener,noreferrer');
      notify('Site aberto em outra guia. Navegação integrada: app desktop.');
    }
    setMenuOpen(false); setSecurityOpen(false);
  }

  function selectTab(id: string) {
    const tab = tabsRef.current.find((item) => item.id === id);
    if (!tab) return;
    activate(id); setTabMenu(null); setMenuOpen(false);
    if (tab.page || tab.error) window.forge?.activateTab(null).catch(() => {});
    else if (window.forge) {
      if (loadedTabs.current.has(id)) window.forge.activateTab(id).catch(() => {});
      else openAddress(tab.url, { targetId: id });
    }
  }

  function closeTab(id: string) {
    const current = tabsRef.current;
    const index = current.findIndex((tab) => tab.id === id);
    if (index < 0) return;
    closedTabs.current = [current[index], ...closedTabs.current].slice(0, 10);
    window.forge?.closeTab(id).then(() => window.forge?.getDownloads().then(setDownloads)).catch(() => {});
    loadedTabs.current.delete(id);
    const next = current.filter((tab) => tab.id !== id);
    if (next.length === 0) {
      const fresh = makeTab(settings.homePage, { private: privateRef.current });
      mutateTabs(() => [fresh]); activate(fresh.id); window.forge?.activateTab(null).catch(() => {});
    } else {
      mutateTabs(() => next);
      if (activeRef.current === id) selectTabAfterClose(next[Math.max(0, index - 1)]);
    }
    setTabMenu(null);
  }

  function selectTabAfterClose(tab: BrowserTab) {
    activate(tab.id);
    if (tab.page || tab.error) window.forge?.activateTab(null).catch(() => {});
    else if (window.forge) {
      if (loadedTabs.current.has(tab.id)) window.forge.activateTab(tab.id).catch(() => {});
      else openAddress(tab.url, { targetId: tab.id });
    }
  }

  function reopenClosed() {
    const last = closedTabs.current.shift();
    if (!last) { notify('Não há abas fechadas recentemente.'); return; }
    const tab = { ...last, id: crypto.randomUUID(), loading: false, error: null };
    insertTab(tab); activate(tab.id);
    if (tab.page) window.forge?.activateTab(null).catch(() => {});
    else openAddress(tab.url, { targetId: tab.id });
  }

  function duplicateTab(tab: BrowserTab) {
    if (tab.page) {
      const copy = makeTab(tab.page, { private: tab.private, pinned: false });
      insertTab(copy); activate(copy.id); window.forge?.activateTab(null).catch(() => {});
    } else openAddress(tab.url, { newTab: true, private: tab.private });
    setTabMenu(null);
  }

  function togglePin(id: string) {
    mutateTabs((current) => {
      const changed = current.map((tab) => tab.id === id ? { ...tab, pinned: !tab.pinned } : tab);
      return [...changed.filter((tab) => tab.pinned), ...changed.filter((tab) => !tab.pinned)];
    });
    setTabMenu(null);
  }

  function reorderTabs(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    mutateTabs((current) => {
      const next = [...current];
      const from = next.findIndex((tab) => tab.id === sourceId);
      const to = next.findIndex((tab) => tab.id === targetId);
      if (from < 0 || to < 0) return current;
      const [moving] = next.splice(from, 1); next.splice(to, 0, moving); return next;
    });
  }

  function goBack() {
    if (!active) return;
    if (!active.page) {
      if (active.canGoBack) window.forge?.tabAction(active.id, 'back').catch(() => {});
      else if (active.previousPage) openPage(active.previousPage);
    } else if (active.previousUrl && /^https?:\/\//.test(active.previousUrl)) openAddress(active.previousUrl);
    else if (active.previousPage && active.previousPage !== active.page) openPage(active.previousPage);
    else if (active.page !== 'home') openPage('home');
  }
  function goForward() { if (active && !active.page && active.canGoForward) window.forge?.tabAction(active.id, 'forward').catch(() => {}); }
  function refresh() {
    if (!active) return;
    if (active.page) { setPageRefresh((value) => value + 1); if (active.page === 'downloads') window.forge?.getDownloads().then(setDownloads).catch(() => {}); }
    else if (window.forge) { mutateTabs((current) => current.map((tab) => tab.id === active.id ? { ...tab, error: null, loading: true } : tab)); window.forge.tabAction(active.id, 'reload').catch(() => {}); }
    else window.open(active.url, '_blank', 'noopener,noreferrer');
  }

  function toggleBookmark() {
    if (!active || active.page === 'home') { notify('Abra uma página para salvar nos favoritos.'); return; }
    const existing = bookmarks.find((bookmark) => bookmark.url === active.url);
    if (existing) { setBookmarks((current) => current.filter((bookmark) => bookmark.id !== existing.id)); notify('Removido dos favoritos.'); }
    else { setBookmarks((current) => [...current, { id: crypto.randomUUID(), title: active.title, url: active.url, folderId: null, createdAt: Date.now() }]); notify('Adicionado aos favoritos.'); }
  }

  function openQuickDialog(link: QuickLink | 'new') {
    setQuickDialog(link); setQuickName(link === 'new' ? '' : link.label);
    setQuickUrl(link === 'new' ? '' : link.url); setQuickError('');
  }
  function saveQuickLink(event: FormEvent) {
    event.preventDefault();
    const url = quickUrl.trim();
    if (!internalPage(url) && !/^https?:\/\//i.test(url)) { setQuickError('Use um endereço HTTP, HTTPS ou uma página Forge.'); return; }
    if (/^https?:\/\//i.test(url)) {
      try { new URL(url); } catch { setQuickError('Endereço inválido.'); return; }
    }
    const link: QuickLink = { id: quickDialog === 'new' || !quickDialog ? crypto.randomUUID() : quickDialog.id, label: quickName.trim(), url, icon: quickDialog === 'new' || !quickDialog ? 'globe' : quickDialog.icon };
    setLinks((current) => quickDialog === 'new' ? [...current, link] : current.map((item) => item.id === link.id ? link : item));
    setQuickDialog(null);
  }

  function onTabState(event: TabStateEvent) {
    const tab = tabsRef.current.find((item) => item.id === event.tabId);
    if (!tab || tab.page) return;
    mutateTabs((current) => current.map((item) => item.id === event.tabId ? {
      ...item, url: /^https?:\/\//.test(event.url) ? event.url : item.url,
      title: event.title || item.title, loading: event.loading,
      canGoBack: event.canGoBack, canGoForward: event.canGoForward,
      security: event.security, error: event.error,
    } : item));
    if (event.navigated && !tab.private && !privateRef.current && /^https?:\/\//.test(event.url)) {
      setHistory((current) => {
        if (current[0]?.url === event.url && Date.now() - current[0].visitedAt < 1500) return current;
        return [{ id: crypto.randomUUID(), title: event.title || displayHost(event.url), url: event.url, visitedAt: Date.now() }, ...current].slice(0, 3000);
      });
    } else if (!event.navigated && !tab.private && !privateRef.current && event.title && /^https?:\/\//.test(event.url)) {
      setHistory((current) => current[0]?.url === event.url && Date.now() - current[0].visitedAt < 30000
        ? [{ ...current[0], title: event.title }, ...current.slice(1)] : current);
    }
  }

  function openPrivateWindow() {
    if (!window.forge) { notify('Janela privada disponível no aplicativo desktop.'); return; }
    window.forge.newPrivateWindow().catch(() => notify('Não foi possível abrir a janela privada.'));
    setMenuOpen(false);
  }

  function handleShortcut(value: string) {
    if (value === 'address') { addressRef.current?.focus(); addressRef.current?.select(); }
    if (value === 'new-tab') newTab();
    if (value === 'close-tab') closeTab(activeRef.current);
    if (value === 'reopen') reopenClosed();
    if (value === 'private-window') openPrivateWindow();
    if (value === 'reload') refresh();
  }
  actionsRef.current = { openPopup: (event) => openAddress(event.url, { newTab: true, background: event.background, private: event.private }), shortcut: handleShortcut };

  useEffect(() => {
    if (!window.forge) return;
    const bridge = window.forge;
    bridge.getEnvironment().then((env) => { setPrivateWindow(env.privateMode); privateRef.current = env.privateMode; setVersion(env.version); }).catch(() => {});
    bridge.getNativeSettings().then(setNative).catch(() => {});
    bridge.getDownloads().then(setDownloads).catch(() => {});
    const offState = bridge.onTabState(onTabState);
    const offOpen = bridge.onOpenTab((event) => actionsRef.current.openPopup(event));
    const offDownload = bridge.onDownload((record) => setDownloads((current) => [record, ...current.filter((item) => item.id !== record.id)]));
    const offShortcut = bridge.onShortcut((value) => actionsRef.current.shortcut(value));
    const offWindow = bridge.onWindowState((state) => setMaximized(state.maximized));
    return () => { offState(); offOpen(); offDownload(); offShortcut(); offWindow(); };
  }, []);

  useEffect(() => { forgeAccount.getUser().then(setUser).catch(() => {}); }, []);
  useEffect(() => { writeStored('appearance', settings); }, [settings]);
  useEffect(() => { writeStored('bookmarks', bookmarks); }, [bookmarks]);
  useEffect(() => { writeStored('folders', folders); }, [folders]);
  useEffect(() => { if (!privateWindow) writeStored('history', history); }, [history, privateWindow]);
  useEffect(() => { writeStored('links', links); }, [links]);
  useEffect(() => {
    if (privateWindow) return;
    const normal = tabs.filter((tab) => !tab.private).map(({ url, title, page, pinned }) => ({ url, title, page, pinned }));
    writeStored('session', { tabs: normal, activeIndex: Math.max(0, tabs.filter((tab) => !tab.private).findIndex((tab) => tab.id === activeId)) } satisfies SavedSession);
  }, [tabs, activeId, privateWindow]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => { setAddress(active?.page ? (active.page === 'home' ? '' : active.url) : active?.url || ''); }, [active?.id, active?.url, active?.page]);
  useEffect(() => {
    if (!window.forge || !active) return;
    if (quickDialog || confirmDialog) window.forge.activateTab(null).catch(() => {});
    else if (active.page || active.error) window.forge.activateTab(null).catch(() => {});
    else if (loadedTabs.current.has(active.id)) window.forge.activateTab(active.id).catch(() => {});
  }, [active?.id, active?.page, active?.error, quickDialog, confirmDialog]);
  useEffect(() => {
    if (!window.forge || !active || active.page || loadedTabs.current.has(active.id)) return;
    openAddress(active.url, { targetId: active.id });
  }, []);
  useLayoutEffect(() => {
    if (!window.forge || !contentRef.current) return;
    const element = contentRef.current;
    const update = () => {
      const rect = element.getBoundingClientRect();
      window.forge?.setContentBounds({ x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element); update();
    window.addEventListener('resize', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, [settings.sidebarExpanded, settings.sidebarPosition, settings.bookmarksBar]);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') { setMenuOpen(false); setTabMenu(null); setSecurityOpen(false); return; }
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (['l', 't', 'w', 'r', 'n'].includes(key)) {
        if (key === 'n' && !event.shiftKey) return;
        event.preventDefault();
        handleShortcut(key === 'l' ? 'address' : key === 't' ? event.shiftKey ? 'reopen' : 'new-tab' : key === 'w' ? 'close-tab' : key === 'r' ? 'reload' : 'private-window');
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  function submitAddress(event: FormEvent) { event.preventDefault(); openAddress(address); addressRef.current?.blur(); }
  function confirmClearHistory() { setConfirmDialog({ title: 'Limpar histórico?', text: 'As páginas visitadas serão removidas deste dispositivo. Seus favoritos permanecem.', action: () => { setHistory([]); notify('Histórico removido.'); } }); }
  function clearPeriod(period: 'today' | 'yesterday' | 'week' | 'older') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const group = (timestamp: number) => timestamp >= today.getTime() ? 'today' : timestamp >= today.getTime() - 86400000 ? 'yesterday' : timestamp >= today.getTime() - 7 * 86400000 ? 'week' : 'older';
    setHistory((current) => current.filter((item) => group(item.visitedAt) !== period));
    notify('Período removido do histórico.');
  }
  function requestClear(kind: 'cache' | 'cookies' | 'storage' | 'all') {
    setConfirmDialog({ title: kind === 'all' ? 'Limpar dados de navegação?' : 'Limpar dados selecionados?', text: kind === 'all' ? 'Cookies, cache, armazenamento de sites e histórico serão removidos. Favoritos serão mantidos.' : 'Estes dados de navegação serão removidos deste dispositivo.', action: () => {
      window.forge?.clearBrowsingData(kind).then(() => { if (kind === 'all') setHistory([]); notify('Dados de navegação removidos.'); }).catch(() => notify('Não foi possível limpar os dados.'));
    } });
  }
  async function downloadAction(id: string, action: 'pause' | 'resume' | 'cancel' | 'open' | 'folder') {
    if (!window.forge) return;
    try { const result = await window.forge.downloadAction(id, action); if (result === false || (typeof result === 'string' && result)) notify('Esta ação não está disponível para o arquivo.'); }
    catch { notify('Não foi possível concluir esta ação.'); }
  }
  async function chooseFolder() {
    const folder = await window.forge?.chooseDownloadFolder();
    if (folder) onNative({ downloadPath: folder });
  }
  async function checkUpdates() {
    if (!window.forge) return;
    try { setUpdateResult(await window.forge.checkForUpdates()); }
    catch { setUpdateResult({ status: 'error' }); }
  }
  function mediaAction(action: 'pip' | 'play' | 'pause' | 'mute' | 'unmute' | 'close-pip') {
    if (!lastExternal || !window.forge) { notify('Abra uma aba com vídeo no aplicativo desktop.'); return; }
    window.forge.mediaAction(lastExternal.id, action).then((result) => notify(result.ok ? action === 'pip' ? 'Mini player aberto, se permitido pelo site.' : 'Controle enviado ao vídeo.' : result.message || 'Vídeo indisponível.')).catch(() => notify('O site não permitiu esta ação.'));
  }
  function openDownloadFolder() {
    window.forge?.openDownloadFolder().then((result) => { if (result) notify('Não foi possível abrir a pasta.'); }).catch(() => notify('Não foi possível abrir a pasta.'));
    if (!window.forge) notify('Pasta de downloads disponível no aplicativo desktop.');
  }

  function renderPage(): ReactNode {
    if (!active) return null;
    if (!active.page) {
      if (active.error) { const copy = errorCopy[active.error]; return <div className="browser-error"><div className="error-mark"><CircleAlert size={38} strokeWidth={1.2} /></div><span className="eyebrow"><span className="eyebrow-line" /> NÃO FOI POSSÍVEL ABRIR</span><h1>{copy.title}</h1><p>{copy.message}</p><code>{active.url}</code><div><Button variant="primary" onClick={refresh}><RotateCw size={17} /> Tentar novamente</Button><Button onClick={() => openPage('home')}>Voltar ao início</Button></div></div>; }
      if (!window.forge) return <div className="browser-preview"><div className="preview-orbit"><Globe2 size={70} strokeWidth={0.85} /></div><span className="eyebrow"><span className="eyebrow-line" /> VISUALIZAÇÃO WEB</span><h1>Navegação completa<br />no aplicativo desktop.</h1><p>O site abriu em uma guia do seu navegador atual. No Forge Browser para Windows, ele aparece aqui com abas, histórico e downloads reais.</p><span className="preview-url">{active.url}</span><Button variant="primary" onClick={() => window.open(active.url, '_blank', 'noopener,noreferrer')}>Abrir site em nova guia <ArrowUpRight size={17} /></Button></div>;
      return <div className="external-canvas">{active.loading && <div className="external-loading"><ForgeMark size={50} /><span>Carregando página...</span></div>}</div>;
    }
    switch (active.page) {
      case 'home': return <HomePage key={pageRefresh} settings={settings} links={links} isPrivate={active.private || privateWindow} onSearch={(query) => openAddress(query)} onOpenLink={(link) => openAddress(link.url)} onAddLink={() => openQuickDialog('new')} onEditLink={openQuickDialog} onCustomize={() => openPage('wallpapers')} />;
      case 'hub': return <HubPage onOpen={(page) => openPage(page)} />;
      case 'game-center': return <GameCenterPage url={settings.gameCenterUrl} onOpenUrl={(url) => openAddress(url)} onConfigure={() => openSettings('forge')} onHub={() => openPage('hub')} />;
      case 'downloads': return <DownloadsPage downloads={downloads} onAction={downloadAction} onOpenFolder={openDownloadFolder} />;
      case 'bookmarks': return <BookmarksPage bookmarks={bookmarks} folders={folders} onOpen={(url) => openAddress(url)} onUpsert={(bookmark) => setBookmarks((current) => current.some((item) => item.id === bookmark.id) ? current.map((item) => item.id === bookmark.id ? bookmark : item) : [...current, bookmark])} onDelete={(id) => setBookmarks((current) => current.filter((item) => item.id !== id))} onCreateFolder={(name) => setFolders((current) => [...current, { id: crypto.randomUUID(), name }])} barEnabled={settings.bookmarksBar} onToggleBar={(value) => onSettings({ bookmarksBar: value })} />;
      case 'history': return <HistoryPage history={history} onOpen={(url) => openAddress(url)} onDelete={(id) => setHistory((current) => current.filter((item) => item.id !== id))} onClearPeriod={clearPeriod} onClearAll={confirmClearHistory} />;
      case 'wallpapers': return <WallpapersPage settings={settings} onChange={onSettings} />;
      case 'settings': return <SettingsPage key={settingsCategory} initialCategory={settingsCategory} settings={settings} native={native} version={version} updateResult={updateResult} onSettings={onSettings} onNative={onNative} onChooseFolder={chooseFolder} onClear={requestClear} onClearHistory={confirmClearHistory} onCheckUpdates={checkUpdates} onOpenRelease={() => { window.forge?.openRelease().catch(() => notify('Não foi possível abrir a release.')); }} onDefaultApps={() => { window.forge?.openDefaultApps().catch(() => notify('Não foi possível abrir as configurações do Windows.')); }} onOpenWallpapers={() => openPage('wallpapers')} onOpenLogin={() => openPage('login')} onOpenHub={() => openPage('hub')} />;
      case 'profile': return <ProfilePage user={user} onLogin={() => openPage('login')} onSettings={() => openPage('settings')} onSignOut={() => forgeAccount.signOut().then(() => { setUser(null); notify('Você saiu da conta Forge.'); }).catch(() => notify('Não foi possível sair da conta.'))} />;
      case 'login': return <LoginPage onBack={() => openPage('profile')} onAuthenticated={(account) => { setUser(account); openPage('profile'); notify('Conta Forge conectada.'); }} />;
      case 'gamer': return <GamerPage tabsCount={tabs.length} native={native} onNative={onNative} onDownloads={() => openPage('downloads')} />;
      case 'player': return <PlayerPage videoTabTitle={lastExternal?.title || null} onAction={mediaAction} onOpenTab={() => newTab()} />;
      default: return <EditorialPage page={active.page} onHub={() => openPage('hub')} onProfile={() => openPage('profile')} />;
    }
  }

  return <div className={`forge-app theme-${settings.theme} ${settings.iconStyle === 'bold' ? 'icons-bold' : ''} ${settings.animations ? '' : 'reduced-motion'} ${privateWindow ? 'private-window' : ''}`} style={{ '--panel-opacity': settings.transparency / 100 } as CSSProperties} onClick={() => { if (tabMenu) setTabMenu(null); }}>
    <header className="titlebar drag-region"><div className="titlebar-brand no-drag" onClick={() => openPage('home')} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') openPage('home'); }}><ForgeWordmark compact /></div><div className="tabs-region"><div className="tab-strip no-drag">{tabs.map((tab) => <div key={tab.id} className={`browser-tab ${tab.id === activeId ? 'active' : ''} ${tab.private ? 'private-tab' : ''} ${tab.pinned ? 'pinned-tab' : ''}`} draggable onDragStart={(event) => { event.dataTransfer.setData('text/plain', tab.id); event.dataTransfer.effectAllowed = 'move'; }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); reorderTabs(event.dataTransfer.getData('text/plain'), tab.id); }} onClick={() => selectTab(tab.id)} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); setTabMenu({ id: tab.id, x: event.clientX, y: event.clientY }); }} role="tab" aria-selected={tab.id === activeId} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') selectTab(tab.id); }}><span className="tab-indicator">{tab.loading ? <span className="tab-spinner" /> : tab.private ? <ShieldCheck size={15} /> : tab.page ? <ForgeMark size={19} /> : <span className="tab-site-letter">{displayHost(tab.url).charAt(0).toUpperCase()}</span>}</span>{!tab.pinned && <span className="tab-title">{tab.title}</span>}<button className="tab-close" type="button" aria-label={`Fechar ${tab.title}`} onClick={(event) => { event.stopPropagation(); closeTab(tab.id); }}><X size={14} /></button></div>)}</div><button type="button" className="new-tab-top no-drag" title="Nova aba (Ctrl+T)" aria-label="Nova aba" onClick={() => newTab()}><Plus size={18} /><span>Nova aba</span></button></div><div className="titlebar-right no-drag"><button className="gamer-shortcut" type="button" onClick={() => openPage('gamer')}><span className="gamer-pulse" /> GAMER MODE</button>{privateWindow && <span className="private-title-indicator"><ShieldCheck size={14} /> PRIVADO</span>}{window.forge && <div className="window-controls"><button title="Minimizar" aria-label="Minimizar" type="button" onClick={() => window.forge?.windowAction('minimize')}><Minus size={15} /></button><button title={maximized ? 'Restaurar' : 'Maximizar'} aria-label={maximized ? 'Restaurar' : 'Maximizar'} type="button" onClick={() => window.forge?.windowAction('maximize')}><Maximize2 size={13} /></button><button className="window-close" title="Fechar" aria-label="Fechar" type="button" onClick={() => window.forge?.windowAction('close')}><X size={17} /></button></div>}</div></header>
    <div className="toolbar"><div className="toolbar-navigation"><IconButton icon={<ArrowLeft size={19} />} label="Voltar" disabled={!canGoBack} onClick={goBack} /><IconButton icon={<ArrowRight size={19} />} label="Avançar" disabled={!active?.canGoForward} onClick={goForward} /><IconButton icon={active?.loading ? <X size={18} /> : <RotateCw size={17} />} label={active?.loading ? 'Parar carregamento' : 'Atualizar'} onClick={() => active?.loading && window.forge ? window.forge.tabAction(active.id, 'stop') : refresh()} /><span className="toolbar-divider" /><IconButton icon={<House size={19} />} label="Início" onClick={() => openPage(settings.homePage)} /></div><form className={`address-bar ${active?.private || privateWindow ? 'address-private' : ''}`} onSubmit={submitAddress}><button type="button" title={active?.security === 'secure' ? 'Conexão HTTPS' : active?.security === 'insecure' ? 'Conexão não segura' : 'Página interna Forge'} className="address-security" onClick={() => setSecurityOpen(!securityOpen)}>{active?.page ? <ForgeMark size={18} /> : active?.security === 'secure' ? <LockKeyhole size={16} /> : <ShieldAlert size={17} />}</button><input ref={addressRef} value={address} onChange={(event) => setAddress(event.target.value)} onFocus={(event) => event.currentTarget.select()} placeholder="Pesquisar ou digitar um endereço" spellCheck={false} autoComplete="off" aria-label="Barra de endereço e pesquisa" /><span className="address-status">{active?.loading ? 'CARREGANDO' : active?.page ? 'FORGE' : active?.security === 'secure' ? 'HTTPS' : 'HTTP'}</span><button className={`address-star ${starred ? 'saved' : ''}`} type="button" title={starred ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} aria-label={starred ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={toggleBookmark}><Star size={18} fill={starred ? 'currentColor' : 'none'} /></button></form><div className="toolbar-actions"><IconButton icon={<Download size={19} />} label="Downloads" onClick={() => openPage('downloads')} />{downloads.some((item) => item.status === 'progressing') && <span className="download-dot" />}<IconButton icon={<Star size={19} />} label="Favoritos" onClick={() => openPage('bookmarks')} /><span className="toolbar-divider" /><IconButton icon={<PanelLeftClose size={19} />} label={settings.sidebarExpanded ? 'Recolher barra lateral' : 'Expandir barra lateral'} onClick={() => onSettings({ sidebarExpanded: !settings.sidebarExpanded })} /><button className="toolbar-profile" title="Perfil Forge" onClick={() => openPage('profile')} type="button">{user?.user_metadata?.display_name?.charAt(0)?.toUpperCase() || <UserRound size={17} />}</button><IconButton icon={<Ellipsis size={21} />} label="Mais opções" active={menuOpen} onClick={() => setMenuOpen(!menuOpen)} /></div></div>
    {settings.bookmarksBar && <div className="bookmark-bar"><span>FAVORITOS</span>{bookmarks.slice(0, 12).map((bookmark) => <button type="button" key={bookmark.id} onClick={() => openAddress(bookmark.url)}><span>{bookmark.title.charAt(0).toUpperCase()}</span>{bookmark.title}</button>)}<button className="bookmark-bar-add" type="button" onClick={() => openPage('bookmarks')}><Plus size={14} /> Gerenciar</button></div>}
    <div className={`workspace ${settings.sidebarPosition === 'right' ? 'sidebar-right' : ''}`}><aside className={`sidebar ${settings.sidebarExpanded ? 'expanded' : ''}`}><div className="sidebar-main">{sidebarItems.map(({ page, label, icon: Icon }, index) => <div key={page}>{index === 3 && <span className="sidebar-separator" />}<button type="button" title={label} aria-label={label} className={`sidebar-item ${active?.page === page ? 'active' : ''}`} onClick={() => openPage(page)}><Icon size={20} strokeWidth={1.7} /><span>{label}</span></button></div>)}</div><div className="sidebar-bottom"><span className="sidebar-separator" /><button type="button" title="Forge Player" aria-label="Forge Player" className={`sidebar-item ${active?.page === 'player' ? 'active' : ''}`} onClick={() => openPage('player')}><PictureInPicture2 size={20} strokeWidth={1.7} /><span>Forge Player</span></button><button type="button" title="Gamer Mode" aria-label="Gamer Mode" className={`sidebar-item ${active?.page === 'gamer' ? 'active' : ''}`} onClick={() => openPage('gamer')}><Cpu size={20} strokeWidth={1.7} /><span>Gamer Mode</span></button><button type="button" title={settings.sidebarExpanded ? 'Recolher sidebar' : 'Expandir sidebar'} aria-label="Alternar sidebar" className="sidebar-item sidebar-toggle" onClick={() => onSettings({ sidebarExpanded: !settings.sidebarExpanded })}><Menu size={19} /><span>{settings.sidebarExpanded ? 'Recolher menu' : 'Expandir menu'}</span></button><div className="sidebar-signature">{settings.sidebarExpanded ? 'FORGE STUDIOS / V1' : 'F / 01'}</div></div></aside><main className="content-area" ref={contentRef}>{renderPage()}</main></div>
    {securityOpen && <div className="security-popover"><div><ShieldCheck size={22} /><strong>{active?.page ? 'Página interna Forge' : active?.security === 'secure' ? 'Conexão HTTPS' : 'Conexão não segura'}</strong></div><p>{active?.page ? 'Esta página faz parte do Forge Browser.' : active?.security === 'secure' ? 'O site usa HTTPS. Isso não garante que o conteúdo seja confiável.' : 'Este site não usa uma conexão HTTPS segura.'}</p><small>{active?.url}</small></div>}
    {menuOpen && <div className="app-dropdown"><button type="button" onClick={() => newTab()}><Plus size={17} /> Nova aba <kbd>Ctrl T</kbd></button><button type="button" onClick={openPrivateWindow}><ShieldCheck size={17} /> Nova janela privada <kbd>Ctrl Shift N</kbd></button><button type="button" onClick={reopenClosed}><RotateCw size={17} /> Reabrir aba fechada</button><span /><button type="button" onClick={() => { openPage('gamer'); setMenuOpen(false); }}><Cpu size={17} /> Gamer Mode</button><button type="button" onClick={() => { openPage('player'); setMenuOpen(false); }}><PictureInPicture2 size={17} /> Forge Player</button><button type="button" onClick={() => { openPage('settings'); setMenuOpen(false); }}><Settings2 size={17} /> Configurações</button><div>FORGE BROWSER <b>V1</b></div></div>}
    {tabMenu && (() => { const tab = tabs.find((item) => item.id === tabMenu.id); return tab ? <div className="tab-context-menu" style={{ left: Math.min(tabMenu.x, window.innerWidth - 205), top: Math.min(tabMenu.y, window.innerHeight - 235) }} onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => duplicateTab(tab)}><Plus size={16} /> Duplicar aba</button><button type="button" onClick={() => togglePin(tab.id)}><Star size={16} /> {tab.pinned ? 'Desafixar aba' : 'Fixar aba'}</button><button type="button" onClick={() => { newTab(true); setTabMenu(null); }}><ShieldCheck size={16} /> Nova aba privada</button><span /><button type="button" onClick={() => closeTab(tab.id)}><X size={16} /> Fechar aba</button></div> : null; })()}
    {quickDialog && <Modal title={quickDialog === 'new' ? 'Novo acesso rápido' : 'Editar acesso rápido'} subtitle="Personalize os atalhos da sua página inicial." onClose={() => setQuickDialog(null)}><form className="modal-form" onSubmit={saveQuickLink}><label>Nome<Input autoFocus required maxLength={28} value={quickName} onChange={(event) => setQuickName(event.target.value)} placeholder="Nome do atalho" /></label><label>Endereço<Input required value={quickUrl} onChange={(event) => setQuickUrl(event.target.value)} placeholder="https://exemplo.com" /></label>{quickError && <p className="form-error">{quickError}</p>}<div className="modal-actions">{quickDialog !== 'new' && <Button type="button" onClick={() => { setLinks((current) => current.filter((item) => item.id !== quickDialog.id)); setQuickDialog(null); }}>Remover</Button>}<Button type="button" onClick={() => setQuickDialog(null)}>Cancelar</Button><Button variant="primary" type="submit">Salvar atalho <ArrowRight size={16} /></Button></div></form></Modal>}
    {confirmDialog && <Modal title={confirmDialog.title} subtitle={confirmDialog.text} onClose={() => setConfirmDialog(null)}><div className="modal-actions confirm-actions"><Button onClick={() => setConfirmDialog(null)}>Cancelar</Button><Button variant="primary" onClick={() => { confirmDialog.action(); setConfirmDialog(null); }}>Confirmar <ArrowRight size={16} /></Button></div></Modal>}
    {toast && <div className="toast" role="status"><span />{toast}<button type="button" aria-label="Fechar aviso" onClick={() => setToast('')}><X size={14} /></button></div>}
  </div>;
}
