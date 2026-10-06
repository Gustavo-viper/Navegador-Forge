import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowDownToLine, BookmarkPlus, Check, Clock3, ExternalLink,
  FileDown, Folder, FolderOpen, Globe2, Pause, Pencil,
  Play, Plus, Search, Star, Trash2, X,
} from 'lucide-react';
import { Button, EmptyState, IconButton, Input, Modal, PageHeading, Toggle } from '../components/ui';
import type { AppearanceSettings, Bookmark, BookmarkFolder, DownloadRecord, HistoryEntry } from '../types/browser';
import { internalPage } from '../utils/address';

function readableSize(bytes: number) {
  if (!bytes) return 'Tamanho desconhecido';
  const unit = bytes >= 1024 ** 3 ? 'GB' : bytes >= 1024 ** 2 ? 'MB' : 'KB';
  const divisor = unit === 'GB' ? 1024 ** 3 : unit === 'MB' ? 1024 ** 2 : 1024;
  return `${(bytes / divisor).toFixed(1)} ${unit}`;
}

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url.startsWith('forge://') ? 'Página Forge' : url; }
}

const downloadStatus: Record<DownloadRecord['status'], string> = {
  progressing: 'Baixando', paused: 'Pausado', completed: 'Concluído',
  cancelled: 'Cancelado', interrupted: 'Interrompido',
};

export function DownloadsPage({ downloads, onAction, onOpenFolder }: {
  downloads: DownloadRecord[];
  onAction: (id: string, action: 'pause' | 'resume' | 'cancel' | 'open' | 'folder') => void;
  onOpenFolder: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const records = [...downloads].sort((a, b) => b.startedAt - a.startedAt).filter((record) => filter === 'all' || (filter === 'active' ? ['progressing', 'paused'].includes(record.status) : record.status === 'completed'));
  return <div className="page-scroll"><div className="page-inner"><PageHeading eyebrow="BIBLIOTECA / ARQUIVOS" title="Downloads" description="Todos os seus arquivos, sem perder o controle." action={<Button onClick={onOpenFolder}><FolderOpen size={17} /> Pasta de downloads</Button>} /><div className="filter-bar"><button type="button" className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Todos <span>{downloads.length}</span></button><button type="button" className={filter === 'active' ? 'selected' : ''} onClick={() => setFilter('active')}>Em andamento</button><button type="button" className={filter === 'completed' ? 'selected' : ''} onClick={() => setFilter('completed')}>Concluídos</button></div>{records.length === 0 ? <EmptyState icon={<ArrowDownToLine size={30} />} title={filter === 'all' ? 'Nada por aqui ainda.' : 'Nenhum download nesta categoria.'} text={filter === 'all' ? 'Os arquivos baixados de sites aparecerão aqui automaticamente no aplicativo desktop.' : 'Seus arquivos aparecerão aqui quando estiverem disponíveis.'} /> : <div className="library-list">{records.map((record) => { const progress = record.totalBytes ? Math.min(100, Math.round(record.receivedBytes / record.totalBytes * 100)) : 0; return <div className="download-row" key={record.id}><div className="file-symbol"><FileDown size={22} /></div><div className="download-main"><div className="download-top"><strong title={record.filename}>{record.filename}</strong><span className={`status-label status-${record.status}`}>{downloadStatus[record.status]}</span></div><span className="file-meta">{readableSize(record.receivedBytes)}{record.totalBytes ? ` / ${readableSize(record.totalBytes)}` : ''} {record.status === 'progressing' && record.speed ? `  ·  ${readableSize(record.speed)}/s` : ''}</span>{['progressing', 'paused'].includes(record.status) && <div className="download-progress"><span style={{ width: `${progress}%` }} /></div>}<small title={record.path}>{record.path || hostOf(record.url)}</small></div><div className="download-actions">{record.status === 'progressing' && <IconButton icon={<Pause size={17} />} label="Pausar" onClick={() => onAction(record.id, 'pause')} />}{record.status === 'paused' && <IconButton icon={<Play size={17} />} label="Continuar" onClick={() => onAction(record.id, 'resume')} />}{['progressing', 'paused'].includes(record.status) && <IconButton icon={<X size={18} />} label="Cancelar" onClick={() => onAction(record.id, 'cancel')} />}{record.status === 'completed' && <><IconButton icon={<ExternalLink size={17} />} label="Abrir arquivo" onClick={() => onAction(record.id, 'open')} /><IconButton icon={<FolderOpen size={17} />} label="Mostrar na pasta" onClick={() => onAction(record.id, 'folder')} /></>}</div></div>; })}</div>}</div></div>;
}

export function BookmarksPage({ bookmarks, folders, onOpen, onUpsert, onDelete, onCreateFolder, barEnabled, onToggleBar }: {
  bookmarks: Bookmark[]; folders: BookmarkFolder[]; onOpen: (url: string) => void;
  onUpsert: (bookmark: Bookmark) => void; onDelete: (id: string) => void;
  onCreateFolder: (name: string) => void; barEnabled: boolean; onToggleBar: (value: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [editing, setEditing] = useState<Bookmark | 'new' | null>(null);
  const [newFolder, setNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function edit(bookmark: Bookmark | 'new') {
    setEditing(bookmark); setTitle(bookmark === 'new' ? '' : bookmark.title);
    setUrl(bookmark === 'new' ? '' : bookmark.url);
    setFolderId(bookmark === 'new' ? null : bookmark.folderId); setError('');
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const value = url.trim();
    if (!internalPage(value)) {
      try {
        const address = new URL(value);
        if (!['http:', 'https:'].includes(address.protocol) || !address.hostname) throw new Error();
      } catch { setError('Use um link HTTP, HTTPS ou uma página Forge válida.'); return; }
    }
    onUpsert({ id: editing !== 'new' && editing ? editing.id : crypto.randomUUID(), title: title.trim() || hostOf(value), url: value, folderId, createdAt: editing !== 'new' && editing ? editing.createdAt : Date.now() });
    setEditing(null);
  }
  const filtered = bookmarks.filter((bookmark) => (folderFilter === 'all' || bookmark.folderId === (folderFilter === 'root' ? null : folderFilter)) && `${bookmark.title} ${bookmark.url}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-scroll"><div className="page-inner"><PageHeading eyebrow="BIBLIOTECA / SALVOS" title="Favoritos" description="Guarde bons caminhos. Encontre tudo mais rápido." action={<Button variant="primary" onClick={() => edit('new')}><Plus size={17} /> Adicionar favorito</Button>} /><div className="library-toolbar"><div className="inline-search"><Search size={17} /><input placeholder="Pesquisar favoritos" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Button onClick={() => setNewFolder(true)}><Folder size={16} /> Nova pasta</Button></div><div className="bookmarks-layout"><aside className="folder-sidebar"><button className={folderFilter === 'all' ? 'active' : ''} onClick={() => setFolderFilter('all')} type="button"><Star size={16} /> Todos <span>{bookmarks.length}</span></button><button className={folderFilter === 'root' ? 'active' : ''} onClick={() => setFolderFilter('root')} type="button"><BookmarkPlus size={16} /> Sem pasta</button>{folders.map((folder) => <button className={folderFilter === folder.id ? 'active' : ''} onClick={() => setFolderFilter(folder.id)} type="button" key={folder.id}><Folder size={16} /> {folder.name}</button>)}<div className="folder-bottom"><span>Barra de favoritos</span><Toggle label="Mostrar barra de favoritos" checked={barEnabled} onChange={onToggleBar} /></div></aside><div className="bookmark-results">{filtered.length === 0 ? <EmptyState icon={<Star size={30} />} title="Nenhum favorito encontrado." text="Salve um site pelo ícone de estrela na barra de endereço ou adicione um aqui." /> : filtered.map((bookmark) => <div className="bookmark-row" key={bookmark.id}><span className="site-letter">{bookmark.title.charAt(0).toUpperCase()}</span><button className="bookmark-info" type="button" onClick={() => onOpen(bookmark.url)}><strong>{bookmark.title}</strong><small>{bookmark.url}</small></button><span className="bookmark-folder-name">{folders.find((folder) => folder.id === bookmark.folderId)?.name || ''}</span><IconButton icon={<Pencil size={16} />} label="Editar favorito" onClick={() => edit(bookmark)} /><IconButton icon={<Trash2 size={16} />} label="Remover favorito" onClick={() => onDelete(bookmark.id)} /></div>)}</div></div></div>{editing && <Modal title={editing === 'new' ? 'Novo favorito' : 'Editar favorito'} subtitle="Organize seus lugares favoritos." onClose={() => setEditing(null)}><form className="modal-form" onSubmit={save}><label>Nome<Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do site" required autoFocus /></label><label>Endereço<Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://exemplo.com" required /></label><label>Pasta<select className="forge-select" value={folderId || ''} onChange={(event) => setFolderId(event.target.value || null)}><option value="">Sem pasta</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><Button type="button" onClick={() => setEditing(null)}>Cancelar</Button><Button variant="primary" type="submit">Salvar favorito <Check size={16} /></Button></div></form></Modal>}{newFolder && <Modal title="Nova pasta" onClose={() => setNewFolder(false)}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); if (folderName.trim()) onCreateFolder(folderName.trim()); setNewFolder(false); setFolderName(''); }}><label>Nome da pasta<Input value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="Minha coleção" required autoFocus /></label><div className="modal-actions"><Button type="button" onClick={() => setNewFolder(false)}>Cancelar</Button><Button variant="primary" type="submit">Criar pasta <Plus size={16} /></Button></div></form></Modal>}</div>;
}

type Period = 'today' | 'yesterday' | 'week' | 'older';
function periodOf(timestamp: number): Period {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  if (timestamp >= start.getTime()) return 'today';
  if (timestamp >= start.getTime() - 86400000) return 'yesterday';
  if (timestamp >= start.getTime() - 7 * 86400000) return 'week';
  return 'older';
}
const periodLabels: Record<Period, string> = { today: 'Hoje', yesterday: 'Ontem', week: 'Últimos 7 dias', older: 'Mais antigos' };

export function HistoryPage({ history, onOpen, onDelete, onClearPeriod, onClearAll }: {
  history: HistoryEntry[]; onOpen: (url: string) => void; onDelete: (id: string) => void;
  onClearPeriod: (period: Period) => void; onClearAll: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => history.filter((item) => `${item.title} ${item.url}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.visitedAt - a.visitedAt), [history, search]);
  return <div className="page-scroll"><div className="page-inner"><PageHeading eyebrow="BIBLIOTECA / PERCURSO" title="Histórico" description="Encontre um caminho de volta quando precisar." action={history.length > 0 && <Button onClick={onClearAll}><Trash2 size={16} /> Limpar histórico</Button>} /><div className="library-toolbar"><div className="inline-search"><Search size={17} /><input placeholder="Pesquisar no histórico" value={search} onChange={(event) => setSearch(event.target.value)} /></div><span className="toolbar-count">{filtered.length} {filtered.length === 1 ? 'página' : 'páginas'}</span></div>{filtered.length === 0 ? <EmptyState icon={<Clock3 size={30} />} title={search ? 'Nenhum resultado.' : 'Seu histórico está limpo.'} text={search ? 'Tente uma busca diferente.' : 'Páginas visitadas aparecerão aqui. Abas privadas não são registradas.'} /> : <div className="history-sections">{(['today', 'yesterday', 'week', 'older'] as Period[]).map((period) => { const entries = filtered.filter((item) => periodOf(item.visitedAt) === period); if (!entries.length) return null; return <section key={period}><div className="history-section-title"><h2>{periodLabels[period]}</h2><button type="button" onClick={() => onClearPeriod(period)}>Excluir período <Trash2 size={14} /></button></div>{entries.map((item) => <div className="history-row" key={item.id}><span className="history-time">{new Date(item.visitedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span><span className="site-letter"><Globe2 size={17} /></span><button type="button" onClick={() => onOpen(item.url)}><strong>{item.title}</strong><small>{hostOf(item.url)} <span>/</span> {item.url}</small></button><IconButton icon={<X size={16} />} label="Excluir do histórico" onClick={() => onDelete(item.id)} /></div>)}</section>; })}</div>}</div></div>;
}

const wallpaperOptions: { id: AppearanceSettings['wallpaper']; title: string; description: string }[] = [
  { id: 'ember', title: 'Forge Ember', description: 'A energia da forja.' },
  { id: 'noir', title: 'Deep Noir', description: 'Silêncio em preto e aço.' },
  { id: 'grid', title: 'Cyber Grid', description: 'Foco, linha por linha.' },
];

export function WallpapersPage({ settings, onChange }: { settings: AppearanceSettings; onChange: (patch: Partial<AppearanceSettings>) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 1_200_000) { setError('Use uma imagem de até 1,2 MB para salvar neste dispositivo.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') { onChange({ wallpaper: 'custom', customWallpaper: reader.result }); setError(''); } };
    reader.readAsDataURL(file);
  }
  const emberImage = new URL('./wallpapers/forge-ember.jpg', window.location.href).href;
  return <div className="page-scroll"><div className="page-inner"><PageHeading eyebrow="PERSONALIZAÇÃO / ATMOSFERA" title="Wallpapers" description="Faça da sua nova aba um lugar seu." action={<Button onClick={() => input.current?.click()}><Plus size={17} /> Usar minha imagem</Button>} /><input ref={input} className="visually-hidden" type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} />{error && <p className="form-error">{error}</p>}<div className="wallpaper-list">{wallpaperOptions.map((item) => <button key={item.id} type="button" className={`wallpaper-option wallpaper-preview-${item.id} ${settings.wallpaper === item.id ? 'chosen' : ''}`} style={item.id === 'ember' ? { backgroundImage: `linear-gradient(0deg, #090d13, transparent), url("${emberImage}")` } : undefined} onClick={() => onChange({ wallpaper: item.id })}><span className="wallpaper-preview-label">FORGE<br />BROWSER<span>.</span></span><span className="wallpaper-option-info"><strong>{item.title}</strong><small>{item.description}</small></span>{settings.wallpaper === item.id && <span className="wallpaper-check"><Check size={15} /></span>}</button>)}{settings.customWallpaper && <button type="button" className={`wallpaper-option wallpaper-preview-custom ${settings.wallpaper === 'custom' ? 'chosen' : ''}`} style={{ backgroundImage: `linear-gradient(0deg, #090d13, transparent), url("${settings.customWallpaper}")` }} onClick={() => onChange({ wallpaper: 'custom' })}><span className="wallpaper-preview-label">FORGE<br />BROWSER<span>.</span></span><span className="wallpaper-option-info"><strong>Minha imagem</strong><small>Wallpaper personalizado</small></span>{settings.wallpaper === 'custom' && <span className="wallpaper-check"><Check size={15} /></span>}</button>}</div><p className="wallpaper-footnote">As imagens personalizadas ficam apenas neste dispositivo. Prefira arquivos leves para manter a inicialização rápida.</p></div></div>;
}