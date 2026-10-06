import { useEffect, useState, type FormEvent } from 'react';
import {
  Activity, ArrowRight, ArrowUpRight, Bell, CircleHelp, Code2, Cpu, Download,
  Gamepad2, Joystick, LockKeyhole, LogOut, MonitorPlay, Newspaper, Palette,
  Pause, PictureInPicture2, Play, Settings2, ShoppingBag, Trophy, UserRound,
  Volume2, VolumeX,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { ForgeMark } from '../components/ForgeLogo';
import { Button, Input, PageHeading, TextLink, Toggle } from '../components/ui';
import { forgeAccount } from '../services/forgeAccount';
import { gameCenterIntegration } from '../services/gameCenter';
import type { NativeSettings, PageId, SystemMetrics } from '../types/browser';

const hubItems: { page: PageId; title: string; description: string; icon: typeof Gamepad2; number: string }[] = [
  { page: 'game-center', title: 'Forge Game Center', description: 'Seu ponto de partida para jogar.', icon: Gamepad2, number: '01' },
  { page: 'forge-games', title: 'Jogos Forge', description: 'Um espaço reservado aos jogos da Forge.', icon: Joystick, number: '02' },
  { page: 'news', title: 'Notícias', description: 'Novidades do ecossistema quando disponíveis.', icon: Newspaper, number: '03' },
  { page: 'wallpapers', title: 'Wallpapers', description: 'Dê outra atmosfera para sua navegação.', icon: Palette, number: '04' },
  { page: 'achievements', title: 'Conquistas', description: 'Progresso da conta Forge no futuro.', icon: Trophy, number: '05' },
  { page: 'profile', title: 'Perfil Forge', description: 'Sua identidade, do seu jeito.', icon: UserRound, number: '06' },
  { page: 'store', title: 'Loja Forge', description: 'Integração comercial ainda não conectada.', icon: ShoppingBag, number: '07' },
  { page: 'settings', title: 'Configurações', description: 'Ajuste a experiência ao seu ritmo.', icon: Settings2, number: '08' },
];

export function HubPage({ onOpen }: { onOpen: (page: PageId) => void }) {
  const wallpaper = new URL('./wallpapers/forge-ember.jpg', window.location.href).href;
  return (
    <div className="page-scroll hub-page">
      <div className="hub-banner">
        <div className="hub-banner-image" style={{ backgroundImage: `url("${wallpaper}")` }} />
        <div className="hub-banner-content"><span className="eyebrow"><span className="eyebrow-line" /> O ECOSSISTEMA FORGE</span><h1>FORGE <em>HUB</em></h1><p>Um lugar para tudo o que move a Forge. Descubra, personalize e siga em frente.</p><Button variant="primary" onClick={() => onOpen('game-center')}>Explorar Game Center <ArrowUpRight size={16} /></Button></div>
        <span className="hub-banner-index">FS / 01</span>
      </div>
      <div className="page-inner hub-content"><div className="section-caption"><span>EXPLORAR O HUB</span><span>01 / 08</span></div><div className="hub-directory">{hubItems.map(({ page, title, description, icon: Icon, number }) => <button type="button" className="hub-link" key={page} onClick={() => onOpen(page)}><span className="hub-link-num">{number}</span><Icon size={21} strokeWidth={1.6} /><span className="hub-link-copy"><strong>{title}</strong><small>{description}</small></span><ArrowUpRight className="hub-link-arrow" size={18} /></button>)}</div></div>
    </div>
  );
}

export function GameCenterPage({ url, onOpenUrl, onConfigure, onHub }: { url: string; onOpenUrl: (url: string) => void; onConfigure: () => void; onHub: () => void }) {
  const destination = gameCenterIntegration.destination(url);
  return <div className="page-scroll"><div className="page-inner"><PageHeading eyebrow="FORGE / JOGAR" title="Game Center" description="Um ponto de entrada para o universo de jogos Forge." action={<TextLink onClick={onHub}>Voltar ao Hub</TextLink>} /><div className="feature-layout"><div className="feature-art game-art"><Gamepad2 size={74} strokeWidth={1} /><span>FORGE GAME CENTER</span></div><div className="feature-copy"><span className="eyebrow"><span className="eyebrow-line" /> INTEGRAÇÃO</span><h2>Seu próximo jogo começa aqui.</h2><p>O navegador está preparado para abrir uma instalação web do Forge Game Center que você configurar. Ainda não existe uma conexão automática entre os aplicativos.</p>{destination ? <Button variant="primary" onClick={() => onOpenUrl(destination)}>Abrir Forge Game Center <ArrowUpRight size={17} /></Button> : <Button variant="primary" onClick={onConfigure}>Configurar Game Center <ArrowRight size={17} /></Button>}<span className="feature-note">{destination ? 'Destino HTTPS configurado nas preferências Forge.' : 'Nenhum destino foi configurado. Nenhum serviço foi inventado.'}</span></div></div></div></div>;
}

const editorialPages: Partial<Record<PageId, { eyebrow: string; title: string; description: string; icon: typeof Gamepad2; detail: string }>> = {
  'forge-games': { eyebrow: 'FORGE / JOGOS', title: 'Jogos Forge', description: 'Um espaço para os títulos da Forge Studios.', icon: Joystick, detail: 'O catálogo ainda não foi conectado. Quando houver uma fonte oficial, os jogos aparecerão aqui.' },
  studios: { eyebrow: 'FORGE / ESTÚDIO', title: 'Forge Studios', description: 'A identidade por trás do Forge Browser.', icon: Code2, detail: 'O Forge Browser nasce como um navegador gamer feito para explorar com liberdade, velocidade e personalidade.' },
  news: { eyebrow: 'FORGE / NOVIDADES', title: 'Notícias', description: 'O que acontece no universo Forge.', icon: Newspaper, detail: 'Nenhum feed de notícias foi configurado. Esta área receberá publicações oficiais quando houver uma integração.' },
  achievements: { eyebrow: 'FORGE / PROGRESSO', title: 'Conquistas', description: 'Suas conquistas merecem um lugar próprio.', icon: Trophy, detail: 'As conquistas dependem de uma fonte de dados Forge. Seu progresso não será simulado.' },
  store: { eyebrow: 'FORGE / LOJA', title: 'Loja Forge', description: 'Um espaço reservado para a loja Forge.', icon: ShoppingBag, detail: 'A loja ainda não tem uma integração configurada. Nenhum produto ou compra fictícia é exibido.' },
};

export function EditorialPage({ page, onHub, onProfile }: { page: PageId; onHub: () => void; onProfile: () => void }) {
  const content = editorialPages[page] || editorialPages.studios!;
  const Icon = content.icon;
  return <div className="page-scroll"><div className="page-inner"><PageHeading eyebrow={content.eyebrow} title={content.title} description={content.description} action={<TextLink onClick={onHub}>Forge Hub</TextLink>} /><div className="editorial-empty"><div className="editorial-symbol"><Icon size={80} strokeWidth={0.9} /></div><div><span className="eyebrow"><span className="eyebrow-line" /> EM CONSTRUÇÃO</span><h2>Espaço pronto.<br />Próximos passos a caminho.</h2><p>{content.detail}</p><Button onClick={page === 'achievements' ? onProfile : onHub}>{page === 'achievements' ? 'Ver perfil' : 'Explorar o Hub'} <ArrowRight size={16} /></Button></div></div></div></div>;
}

export function ProfilePage({ user, onLogin, onSettings, onSignOut }: { user: User | null; onLogin: () => void; onSettings: () => void; onSignOut: () => void }) {
  const name = typeof user?.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : user?.email?.split('@')[0] || 'Visitante Forge';
  return <div className="page-scroll"><div className="page-inner"><PageHeading eyebrow="FORGE / IDENTIDADE" title="Perfil Forge" description="Sua conta é opcional. Navegar sempre será livre." /><div className="profile-top"><div className="profile-avatar">{user ? name.charAt(0).toUpperCase() : <UserRound size={45} strokeWidth={1.3} />}</div><div><span className="eyebrow">{user ? 'CONTA CONECTADA' : 'MODO VISITANTE'}</span><h2>{name}</h2><p>{user?.email || 'Entre para conectar sua identidade Forge quando o serviço estiver disponível.'}</p></div><div className="profile-action">{user ? <Button onClick={onSignOut}><LogOut size={16} /> Sair da conta</Button> : <Button variant="primary" onClick={onLogin}>Entrar na Forge <ArrowRight size={16} /></Button>}</div></div><div className="profile-details"><div><span>USERNAME</span><strong>{user?.user_metadata?.username || user?.email?.split('@')[0] || 'Não conectado'}</strong></div><div><span>NÍVEL / XP</span><strong>Sem dados conectados</strong></div><div><span>CONQUISTAS</span><strong>Integração futura</strong></div><div><span>JOGOS</span><strong>Integração futura</strong></div></div><div className="profile-bottom"><div><h3>Preferências da sua experiência</h3><p>Temas, atalhos e comportamento do navegador continuam disponíveis sem conta.</p></div><Button onClick={onSettings}>Abrir configurações <Settings2 size={16} /></Button></div></div></div>;
}

export function LoginPage({ onBack, onAuthenticated }: { onBack: () => void; onAuthenticated: (user: User | null) => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (mode === 'reset') { await forgeAccount.resetPassword(email); setMessage('Se esta conta existir, você receberá um e-mail de recuperação.'); }
      else if (mode === 'signup') { const result = await forgeAccount.signUp(email, password, name); setMessage('Conta enviada. Verifique seu e-mail se a confirmação estiver ativa.'); if (result.session && result.user) onAuthenticated(result.user); }
      else { onAuthenticated(await forgeAccount.signIn(email, password)); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível continuar.'); }
    finally { setBusy(false); }
  }

  return <div className="login-page page-scroll"><div className="login-aside"><ForgeMark size={62} /><span>FORGE STUDIOS</span><h2>SEU MUNDO.<br />SUAS REGRAS.</h2><p>Uma conta amplia o universo Forge. A navegação é sua, com ou sem login.</p></div><div className="login-form-side"><div className="login-form-wrap"><button className="text-link login-back" onClick={onBack} type="button">Voltar ao navegador <ArrowRight size={15} /></button><span className="eyebrow"><span className="eyebrow-line" /> CONTA FORGE</span><h1>{mode === 'login' ? 'Boas-vindas de volta.' : mode === 'signup' ? 'Entre para a Forge.' : 'Recuperar acesso.'}</h1><p>{mode === 'reset' ? 'Enviaremos instruções para seu e-mail.' : 'Sua identidade Forge em um só lugar.'}</p><form onSubmit={submit} className="login-form">{mode === 'signup' && <label>Nome<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Como podemos chamar você?" required /></label>}<label>E-mail<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" required /></label>{mode !== 'reset' && <label>Senha<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" minLength={6} required /></label>}<Button variant="primary" type="submit" disabled={busy}>{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar recuperação'} <ArrowRight size={17} /></Button></form>{message && <p className="form-message" role="status">{message}</p>}{!forgeAccount.configured && <p className="login-config-note"><LockKeyhole size={15} /> Autenticação indisponível até configurar o Supabase.</p>}<div className="login-switch">{mode !== 'signup' && <button type="button" onClick={() => { setMode('signup'); setMessage(''); }}>Criar conta</button>}{mode !== 'reset' && <button type="button" onClick={() => { setMode('reset'); setMessage(''); }}>Esqueci minha senha</button>}{mode !== 'login' && <button type="button" onClick={() => { setMode('login'); setMessage(''); }}>Já tenho conta</button>}</div></div></div></div>;
}

export function GamerPage({ tabsCount, native, onNative, onDownloads }: { tabsCount: number; native: NativeSettings; onNative: (patch: Partial<NativeSettings>) => void; onDownloads: () => void }) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  useEffect(() => {
    let active = true;
    const update = () => { window.forge?.getMetrics().then((value) => { if (active) setMetrics(value); }).catch(() => {}); };
    update(); const timer = window.setInterval(update, 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return <div className="page-scroll"><div className="page-inner"><PageHeading eyebrow="FORGE / DESEMPENHO" title="Gamer Mode" description="Uma visão honesta do que o Forge Browser está usando agora." /><div className="gamer-hero"><div><span className="eyebrow"><span className="eyebrow-line" /> MONITOR EM TEMPO REAL</span><h2>Fique por dentro.<br /><em>Sem perder o foco.</em></h2><p>Estes números são dos processos do navegador, não do sistema inteiro.</p></div><Activity size={92} strokeWidth={0.8} /></div><div className="metric-grid"><div><span>MEMÓRIA RAM</span><strong>{metrics ? metrics.ramMB.toLocaleString('pt-BR') : '--'}<small> MB</small></strong><p>Processos Forge</p></div><div><span>USO DE CPU</span><strong>{metrics ? metrics.cpuPercent.toLocaleString('pt-BR') : '--'}<small> %</small></strong><p>Uso no intervalo medido</p></div><div><span>ABAS ABERTAS</span><strong>{tabsCount.toString().padStart(2, '0')}</strong><p>Nesta janela</p></div></div><div className="gamer-lower"><div className="gamer-row"><Cpu size={20} /><div><strong>Processos ativos</strong><p>Inclui renderização, GPU e utilitários.</p></div><b>{metrics ? metrics.processes : '--'}</b></div><button className="gamer-row" onClick={onDownloads} type="button"><Download size={20} /><div><strong>Downloads em andamento</strong><p>Ver arquivos e controlar transferências.</p></div><b>{metrics ? metrics.activeDownloads : '--'}</b><ArrowRight size={16} /></button><div className="gamer-row"><Bell size={20} /><div><strong>Notificações de sites</strong><p>Bloquear solicitações enquanto você navega.</p></div><Toggle label="Bloquear notificações" checked={native.blockNotifications} onChange={(value) => onNative({ blockNotifications: value })} disabled={!window.forge} /></div></div><p className="honest-note"><CircleHelp size={15} /> O Gamer Mode V1 monitora recursos e controla notificações. Não limita CPU ou RAM de outros aplicativos.</p></div></div>;
}

export function PlayerPage({ videoTabTitle, onAction, onOpenTab }: { videoTabTitle: string | null; onAction: (action: 'pip' | 'play' | 'pause' | 'mute' | 'unmute' | 'close-pip') => void; onOpenTab: () => void }) {
  const [muted, setMuted] = useState(false);
  return <div className="page-scroll"><div className="page-inner"><PageHeading eyebrow="FORGE / MÍDIA" title="Forge Player" description="Seu atalho para o vídeo da aba. Sem serviços fictícios, só o que está tocando." /><div className="player-stage"><div className="player-glow" /><MonitorPlay size={88} strokeWidth={0.8} /><span>FORGE PLAYER / V1</span><h2>{videoTabTitle || 'Nenhuma aba de vídeo selecionada'}</h2><p>O mini player usa Picture-in-Picture nativo quando o site e o vídeo permitem.</p></div><div className="player-controls"><Button variant="primary" onClick={() => onAction('pip')} disabled={!videoTabTitle || !window.forge}><PictureInPicture2 size={18} /> Abrir mini player</Button><button type="button" title="Reproduzir" disabled={!videoTabTitle || !window.forge} onClick={() => onAction('play')}><Play size={19} /></button><button type="button" title="Pausar" disabled={!videoTabTitle || !window.forge} onClick={() => onAction('pause')}><Pause size={19} /></button><button type="button" title={muted ? 'Ativar som' : 'Silenciar'} disabled={!videoTabTitle || !window.forge} onClick={() => { onAction(muted ? 'unmute' : 'mute'); setMuted(!muted); }}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button><button type="button" className="player-close-pip" disabled={!videoTabTitle || !window.forge} onClick={() => onAction('close-pip')}>Fechar mini player</button></div><div className="player-help"><p>Para usar, abra um site com vídeo em outra aba. Controles dependem do suporte do site e do Chromium. Próxima faixa é controlada pelo próprio serviço de mídia.</p><TextLink onClick={onOpenTab}>Abrir uma nova aba</TextLink></div></div></div>;
}