import { useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight, BellOff, Brush, Check, CircleHelp, Cookie, Download, ExternalLink,
  FolderOpen, Gamepad2, Globe2, History, LayoutPanelLeft, LockKeyhole,
  Monitor, RotateCcw, Search, Settings2, ShieldCheck, Sparkles, Trash2,
  X,
} from 'lucide-react';
import { Button, IconButton, Input, PageHeading, Toggle } from '../components/ui';
import { configuredGameCenterUrl } from '../services/gameCenter';
import type { AppearanceSettings, NativeSettings, SearchEngine, ThemeId, UpdateResult } from '../types/browser';

type Category = 'general' | 'appearance' | 'privacy' | 'downloads' | 'tabs' | 'search' | 'forge' | 'system';

const categories: { id: Category; label: string; icon: typeof Monitor }[] = [
  { id: 'general', label: 'Geral', icon: Monitor },
  { id: 'appearance', label: 'Aparência', icon: Brush },
  { id: 'privacy', label: 'Privacidade', icon: ShieldCheck },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'tabs', label: 'Abas', icon: LayoutPanelLeft },
  { id: 'search', label: 'Pesquisa', icon: Search },
  { id: 'forge', label: 'Forge', icon: Gamepad2 },
  { id: 'system', label: 'Sistema', icon: Settings2 },
];

function SettingRow({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <div className="setting-row"><div><strong>{title}</strong>{description && <p>{description}</p>}</div><div className="setting-control">{children}</div></div>;
}

function OptionButtons<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <div className="option-buttons">{options.map((option) => <button type="button" key={option.value} className={value === option.value ? 'selected' : ''} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}

export function SettingsPage({ initialCategory = 'general', settings, native, version, updateResult, onSettings, onNative, onChooseFolder, onClear, onClearHistory, onCheckUpdates, onOpenRelease, onDefaultApps, onOpenWallpapers, onOpenLogin, onOpenHub }: {
  initialCategory?: Category;
  settings: AppearanceSettings;
  native: NativeSettings;
  version: string;
  updateResult: UpdateResult | null;
  onSettings: (patch: Partial<AppearanceSettings>) => void;
  onNative: (patch: Partial<NativeSettings>) => void;
  onChooseFolder: () => void;
  onClear: (kind: 'cache' | 'cookies' | 'storage' | 'all') => void;
  onClearHistory: () => void;
  onCheckUpdates: () => void;
  onOpenRelease: () => void;
  onDefaultApps: () => void;
  onOpenWallpapers: () => void;
  onOpenLogin: () => void;
  onOpenHub: () => void;
}) {
  const [category, setCategory] = useState<Category>(initialCategory);
  const [cookies, setCookies] = useState<{ domain: string; count: number }[] | null>(null);
  const [cookieBusy, setCookieBusy] = useState(false);
  const [site, setSite] = useState('');
  const [permission, setPermission] = useState<'notifications' | 'media' | 'geolocation'>('notifications');
  const [siteError, setSiteError] = useState('');
  const [gameUrl, setGameUrl] = useState(settings.gameCenterUrl);
  const [repo, setRepo] = useState(native.releaseRepository);
  const [checking, setChecking] = useState(false);
  const desktop = Boolean(window.forge);

  async function loadCookies() {
    if (!window.forge) return;
    setCookieBusy(true);
    try { setCookies(await window.forge.listCookies()); } catch { setCookies([]); }
    finally { setCookieBusy(false); }
  }
  async function deleteCookies(domain: string) {
    await window.forge?.deleteCookiesForDomain(domain);
    await loadCookies();
  }
  function savePermission(event: FormEvent) {
    event.preventDefault();
    try {
      const origin = new URL(site.trim()).origin;
      if (!origin.startsWith('https://')) throw new Error();
      onNative({ sitePermissions: { ...native.sitePermissions, [`${origin}|${permission}`]: true } });
      setSite(''); setSiteError('');
    } catch { setSiteError('Use uma origem HTTPS válida, como https://exemplo.com.'); }
  }
  function saveGameUrl() {
    if (gameUrl.trim() && !configuredGameCenterUrl(gameUrl.trim())) { setSiteError('O Game Center precisa de um endereço HTTPS válido.'); return; }
    onSettings({ gameCenterUrl: gameUrl.trim() }); setSiteError('');
  }
  async function check() {
    setChecking(true); await onCheckUpdates(); setChecking(false);
  }

  const pageTitles: Record<Category, { title: string; description: string }> = {
    general: { title: 'Geral', description: 'Deixe o Forge Browser pronto para o seu jeito de navegar.' },
    appearance: { title: 'Aparência', description: 'Dê personalidade a cada detalhe do navegador.' },
    privacy: { title: 'Privacidade', description: 'Você decide o que fica e o que vai embora.' },
    downloads: { title: 'Downloads', description: 'Defina onde seus arquivos devem chegar.' },
    tabs: { title: 'Abas', description: 'Encontre o fluxo certo para cada sessão.' },
    search: { title: 'Pesquisa', description: 'Escolha para onde suas pesquisas vão.' },
    forge: { title: 'Forge', description: 'Conecte o navegador ao seu universo Forge.' },
    system: { title: 'Sistema', description: 'Versão, atualizações e informações do aplicativo.' },
  };

  return <div className="page-scroll settings-page"><div className="settings-layout"><aside className="settings-nav"><span className="settings-nav-label">PREFERÊNCIAS</span>{categories.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={category === id ? 'active' : ''} onClick={() => setCategory(id)}><Icon size={18} strokeWidth={1.7} /> {label} {category === id && <ArrowRight size={15} />}</button>)}<div className="settings-nav-footer">FORGE BROWSER<br /><span>V1 / FORGE STUDIOS</span></div></aside><div className="settings-content"><PageHeading eyebrow={`CONFIGURAÇÕES / ${category.toUpperCase()}`} title={pageTitles[category].title} description={pageTitles[category].description} />
      {category === 'general' && <div className="settings-groups"><section><h2>Ao abrir o navegador</h2><SettingRow title="Página inicial" description="Onde o botão Início leva você."><OptionButtons value={settings.homePage} options={[{ value: 'home', label: 'Forge Home' }, { value: 'hub', label: 'Forge Hub' }]} onChange={(value) => onSettings({ homePage: value })} /></SettingRow><SettingRow title="Inicialização" description="Restaure suas abas normais ou comece de novo."><OptionButtons value={settings.startup} options={[{ value: 'new-tab', label: 'Nova aba' }, { value: 'restore', label: 'Restaurar abas' }]} onChange={(value) => onSettings({ startup: value })} /></SettingRow></section><section><h2>Navegador padrão</h2><SettingRow title="Abrir links com Forge" description="O Windows gerencia a escolha do navegador padrão nas configurações do sistema."><Button onClick={onDefaultApps} disabled={!desktop}>Abrir apps padrão <ExternalLink size={15} /></Button></SettingRow></section></div>}
      {category === 'appearance' && <div className="settings-groups"><section><h2>Temas Forge</h2><div className="theme-choices">{([{ id: 'dark', name: 'Forge Dark' }, { id: 'neon', name: 'Forge Neon' }, { id: 'cyber', name: 'Forge Cyber' }, { id: 'minimal', name: 'Forge Minimal' }] as { id: ThemeId; name: string }[]).map(({ id, name }) => <button key={id} type="button" onClick={() => onSettings({ theme: id })} className={`theme-choice theme-swatch-${id} ${settings.theme === id ? 'selected' : ''}`}><span className="theme-swatch"><i /><b /><b /></span><span>{name}</span>{settings.theme === id && <Check size={15} />}</button>)}</div></section><section><h2>Plano de fundo</h2><SettingRow title="Wallpaper da nova aba" description="Escolha uma atmosfera ou envie sua imagem."><Button onClick={onOpenWallpapers}>Explorar wallpapers <ArrowRight size={16} /></Button></SettingRow><SettingRow title="Transparência dos painéis" description={`${settings.transparency}% de opacidade nos painéis da interface.`}><input className="forge-range" type="range" min="65" max="100" value={settings.transparency} onChange={(event) => onSettings({ transparency: Number(event.target.value) })} /></SettingRow></section><section><h2>Interface</h2><SettingRow title="Barra lateral expandida" description="Mostrar nomes ao lado dos ícones."><Toggle label="Expandir barra lateral" checked={settings.sidebarExpanded} onChange={(value) => onSettings({ sidebarExpanded: value })} /></SettingRow><SettingRow title="Posição da barra lateral" description="Escolha o lado que faz mais sentido."><OptionButtons value={settings.sidebarPosition} options={[{ value: 'left', label: 'Esquerda' }, { value: 'right', label: 'Direita' }]} onChange={(value) => onSettings({ sidebarPosition: value })} /></SettingRow><SettingRow title="Animações suaves" description="Transições discretas entre elementos."><Toggle label="Animações" checked={settings.animations} onChange={(value) => onSettings({ animations: value })} /></SettingRow><SettingRow title="Sons da interface" description="Feedback sutil ao abrir uma nova aba."><Toggle label="Sons" checked={settings.sounds} onChange={(value) => onSettings({ sounds: value })} /></SettingRow><SettingRow title="Barra de favoritos" description="Seus sites salvos abaixo do endereço."><Toggle label="Barra de favoritos" checked={settings.bookmarksBar} onChange={(value) => onSettings({ bookmarksBar: value })} /></SettingRow></section></div>}
      {category === 'privacy' && <div className="settings-groups"><section><h2>Proteções de navegação</h2><SettingRow title="Bloquear rastreadores conhecidos" description="Filtro básico de domínios conhecidos. Não substitui um bloqueador completo."><Toggle label="Bloquear rastreadores" checked={native.blockTrackers} onChange={(value) => onNative({ blockTrackers: value })} disabled={!desktop} /></SettingRow><SettingRow title="Bloquear pop-ups automáticos" description="Links abertos por você continuam disponíveis em novas abas."><Toggle label="Bloquear pop-ups" checked={native.blockPopups} onChange={(value) => onNative({ blockPopups: value })} disabled={!desktop} /></SettingRow><SettingRow title="Bloquear notificações" description="Sites não poderão mostrar alertas sem sua permissão."><Toggle label="Bloquear notificações" checked={native.blockNotifications} onChange={(value) => onNative({ blockNotifications: value })} disabled={!desktop} /></SettingRow></section><section><h2>Permissões por site</h2><p className="section-description">Solicitações são negadas por padrão. Permita somente origens HTTPS em que você confia.</p><form className="permission-form" onSubmit={savePermission}><Input type="url" value={site} onChange={(event) => setSite(event.target.value)} placeholder="https://exemplo.com" required disabled={!desktop} /><select className="forge-select" value={permission} onChange={(event) => setPermission(event.target.value as typeof permission)} disabled={!desktop}><option value="notifications">Notificações</option><option value="media">Câmera / microfone</option><option value="geolocation">Localização</option></select><Button type="submit" disabled={!desktop}>Permitir <Check size={15} /></Button></form>{siteError && <p className="form-error">{siteError}</p>}{Object.entries(native.sitePermissions).filter(([, allowed]) => allowed).map(([key]) => <div className="permission-entry" key={key}><LockKeyhole size={15} /><span>{key.replace('|', ' / ')}</span><IconButton label="Remover permissão" icon={<X size={15} />} onClick={() => { const next = { ...native.sitePermissions }; delete next[key]; onNative({ sitePermissions: next }); }} /></div>)}</section><section><h2>Cookies e dados</h2><SettingRow title="Cookies armazenados" description="Veja e remova cookies por domínio."><Button onClick={() => cookies === null ? loadCookies() : setCookies(null)} disabled={!desktop}><Cookie size={16} /> {cookies === null ? 'Gerenciar cookies' : 'Ocultar cookies'}</Button></SettingRow>{cookies !== null && <div className="cookie-list">{cookieBusy ? <p>Carregando...</p> : cookies.length ? cookies.map(({ domain, count }) => <div key={domain}><span>{domain} <small>{count} {count === 1 ? 'cookie' : 'cookies'}</small></span><IconButton icon={<Trash2 size={15} />} label={`Excluir cookies de ${domain}`} onClick={() => deleteCookies(domain)} /></div>) : <p>Nenhum cookie salvo.</p>}</div>}<SettingRow title="Limpar cache" description="Remove arquivos temporários de páginas."><Button onClick={() => onClear('cache')} disabled={!desktop}><RotateCcw size={15} /> Limpar cache</Button></SettingRow><SettingRow title="Limpar armazenamento" description="Remove armazenamento local de sites visitados."><Button onClick={() => onClear('storage')} disabled={!desktop}><Trash2 size={15} /> Limpar dados locais</Button></SettingRow><SettingRow title="Limpar dados de navegação" description="Remove cookies, cache, armazenamento e histórico local."><Button onClick={() => onClear('all')} disabled={!desktop}>Limpar tudo <Trash2 size={15} /></Button></SettingRow><SettingRow title="Limpar somente histórico" description="Mantém seus favoritos e preferências."><Button onClick={onClearHistory}><History size={15} /> Limpar histórico</Button></SettingRow></section>{!desktop && <p className="settings-notice"><BellOff size={16} /> Os controles do Chromium estão disponíveis no aplicativo desktop.</p>}</div>}
      {category === 'downloads' && <div className="settings-groups"><section><h2>Arquivos</h2><SettingRow title="Pasta padrão" description={native.downloadPath || 'Pasta Downloads do sistema'}><Button onClick={onChooseFolder} disabled={!desktop}><FolderOpen size={16} /> Alterar pasta</Button></SettingRow><SettingRow title="Perguntar onde salvar cada arquivo" description="Exibe o seletor de arquivos antes de cada download."><Toggle label="Perguntar onde salvar" checked={native.askDownloadLocation} onChange={(value) => onNative({ askDownloadLocation: value })} disabled={!desktop} /></SettingRow></section><p className="settings-notice"><CircleHelp size={16} /> Downloads privados continuam sendo arquivos reais salvos na pasta escolhida por você.</p></div>}
      {category === 'tabs' && <div className="settings-groups"><section><h2>Comportamento</h2><SettingRow title="Posição de novas abas" description="Onde inserir uma aba no conjunto atual."><OptionButtons value={settings.newTabPosition} options={[{ value: 'next', label: 'Ao lado da atual' }, { value: 'end', label: 'No final' }]} onChange={(value) => onSettings({ newTabPosition: value })} /></SettingRow><div className="shortcut-list"><span>ATALHOS ÚTEIS</span><div><p>Nova aba</p><kbd>Ctrl + T</kbd></div><div><p>Fechar aba</p><kbd>Ctrl + W</kbd></div><div><p>Reabrir aba</p><kbd>Ctrl + Shift + T</kbd></div><div><p>Ir ao endereço</p><kbd>Ctrl + L</kbd></div><div><p>Janela privada</p><kbd>Ctrl + Shift + N</kbd></div></div></section></div>}
      {category === 'search' && <div className="settings-groups"><section><h2>Mecanismo de pesquisa</h2><p className="section-description">Termos que não são endereços serão pesquisados com o mecanismo selecionado.</p><div className="search-engines">{(['Google', 'DuckDuckGo', 'Bing'] as SearchEngine[]).map((engine) => <button type="button" key={engine} onClick={() => onSettings({ searchEngine: engine })} className={settings.searchEngine === engine ? 'selected' : ''}><Globe2 size={19} /><span>{engine}</span>{settings.searchEngine === engine && <Check size={17} />}</button>)}</div></section></div>}
      {category === 'forge' && <div className="settings-groups"><section><h2>Conta Forge</h2><SettingRow title="Sua identidade Forge" description="O navegador também funciona completamente sem login."><Button onClick={onOpenLogin}>Abrir conta Forge <ArrowRight size={16} /></Button></SettingRow><SettingRow title="Forge Hub" description="Explore as áreas do ecossistema."><Button onClick={onOpenHub}>Abrir o Hub <ArrowRight size={16} /></Button></SettingRow></section><section><h2>Forge Game Center</h2><p className="section-description">Configure um endereço HTTPS oficial quando houver uma instalação web disponível. Nenhuma API externa é presumida.</p><div className="setting-input-line"><Input type="url" value={gameUrl} onChange={(event) => setGameUrl(event.target.value)} placeholder="https://seu-game-center.example" /><Button onClick={saveGameUrl}>Salvar destino <Check size={16} /></Button></div>{siteError && <p className="form-error">{siteError}</p>}<p className="field-hint">Deixe vazio para manter a integração desativada.</p></section></div>}
      {category === 'system' && <div className="settings-groups"><section><h2>Sobre este navegador</h2><SettingRow title="Forge Browser" description="Desenvolvido pela Forge Studios."><span className="version-label">VERSÃO {version}</span></SettingRow><SettingRow title="Plataforma" description="Primeira versão desktop preparada para Windows 10 e 11."><span className="version-label">CHROMIUM / ELECTRON</span></SettingRow></section><section><h2>Atualizações</h2><p className="section-description">A consulta usa a release mais recente do repositório GitHub configurado. Instalação de atualizações permanece manual nesta V1.</p><div className="setting-input-line"><Input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repository" /><Button onClick={() => onNative({ releaseRepository: repo.trim() })}>Salvar fonte</Button></div><p className="field-hint">Repositório público no formato owner/repository.</p><div className="update-line"><div className={`update-indicator update-${updateResult?.status || 'idle'}`}><Sparkles size={19} /><div><strong>{updateResult?.status === 'current' ? 'Forge Browser está atualizado' : updateResult?.status === 'available' ? 'Nova versão disponível' : updateResult?.status === 'error' ? 'Não foi possível verificar' : 'Fonte de atualização não configurada'}</strong><span>{updateResult?.status === 'available' ? `Versão ${updateResult.version} encontrada no GitHub.` : updateResult?.status === 'current' ? `Última versão: ${updateResult.version}.` : 'Configure um repositório de releases para verificar.'}</span></div></div><Button onClick={check} disabled={checking || !desktop}>{checking ? 'Verificando...' : 'Verificar agora'} <RotateCcw size={15} /></Button></div>{updateResult?.status === 'available' && <Button variant="primary" onClick={onOpenRelease}>Ver release no GitHub <ExternalLink size={15} /></Button>}</section><p className="settings-notice"><ShieldCheck size={16} /> Atualizações nunca são anunciadas sem consultar uma fonte real.</p></div>}
      {category === 'appearance' && <section className="settings-extra-section"><h2>Estilo dos ícones</h2><SettingRow title="Traço dos ícones" description="Escolha um visual mais leve ou mais marcado para a interface."><OptionButtons value={settings.iconStyle} options={[{ value: 'outline', label: 'Contorno' }, { value: 'bold', label: 'Marcado' }]} onChange={(value) => onSettings({ iconStyle: value })} /></SettingRow></section>}
    </div></div></div>;
}