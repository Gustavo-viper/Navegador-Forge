import { useState, type FormEvent } from 'react';
import { ArrowRight, Code2, Gamepad2, Globe2, Joystick, Play, Plus, Search, Settings2 } from 'lucide-react';
import { ForgeMark } from '../components/ForgeLogo';
import type { AppearanceSettings, QuickLink } from '../types/browser';

function ShortcutIcon({ icon }: { icon: string }) {
  if (icon === 'gamepad') return <Gamepad2 size={23} strokeWidth={1.7} />;
  if (icon === 'joystick') return <Joystick size={23} strokeWidth={1.7} />;
  if (icon === 'forge') return <ForgeMark size={27} />;
  if (icon === 'youtube') return <Play size={23} strokeWidth={1.8} />;
  if (icon === 'google') return <span className="google-g">G</span>;
  if (icon === 'github') return <Code2 size={23} strokeWidth={1.8} />;
  return <Globe2 size={22} strokeWidth={1.7} />;
}

export default function HomePage({ settings, links, isPrivate, onSearch, onOpenLink, onAddLink, onEditLink, onCustomize }: {
  settings: AppearanceSettings;
  links: QuickLink[];
  isPrivate: boolean;
  onSearch: (query: string) => void;
  onOpenLink: (link: QuickLink) => void;
  onAddLink: () => void;
  onEditLink: (link: QuickLink) => void;
  onCustomize: () => void;
}) {
  const [query, setQuery] = useState('');
  const image = settings.wallpaper === 'custom' && settings.customWallpaper
    ? settings.customWallpaper : new URL('./wallpapers/forge-ember.jpg', window.location.href).href;
  function submit(event: FormEvent) { event.preventDefault(); if (query.trim()) { onSearch(query); setQuery(''); } }

  return (
    <div className={`home-page wallpaper-${settings.wallpaper} ${isPrivate ? 'private-home' : ''}`}>
      {(settings.wallpaper === 'ember' || settings.wallpaper === 'custom') && <div className="home-photo" style={{ backgroundImage: `url("${image}")` }} />}
      <div className="home-shade" />
      <div className="home-topline"><span><i /> {isPrivate ? 'SESSÃO PRIVADA' : 'SEU ESPAÇO. SUAS REGRAS.'}</span><button type="button" onClick={onCustomize}><Settings2 size={15} /> PERSONALIZAR</button></div>
      <div className="home-main">
        <div className="home-brand-overline">A WEB NO SEU RITMO <span> / </span> FORGE STUDIOS</div>
        <h1 className="home-title"><span>FORGE</span><strong>BROWSER<span className="brand-period">.</span></strong></h1>
        <p className="home-subtitle">Tudo o que você busca. Um lugar feito para ir além.</p>
        <form className="home-search" onSubmit={submit}>
          <Search size={23} strokeWidth={1.8} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Pesquisar ou digitar um endereço" placeholder="Pesquisar ou digitar um endereço" autoComplete="off" />
          <span className="home-search-hint">{settings.searchEngine}</span>
          <button type="submit" aria-label="Pesquisar"><ArrowRight size={21} /></button>
        </form>
        <div className="quick-section">
          <div className="quick-heading"><span>ACESSO RÁPIDO</span><span className="quick-rule" /><button type="button" onClick={onCustomize}>Editar aparência <ArrowRight size={13} /></button></div>
          <div className="quick-links">
            {links.map((link) => <button key={link.id} className="quick-link" type="button" title={`${link.label} (clique com o botão direito para editar)`} onClick={() => onOpenLink(link)} onContextMenu={(event) => { event.preventDefault(); onEditLink(link); }}><span className="quick-link-icon"><ShortcutIcon icon={link.icon} /></span><span>{link.label}</span></button>)}
            <button className="quick-link" type="button" onClick={onAddLink}><span className="quick-link-icon quick-add"><Plus size={22} strokeWidth={1.6} /></span><span>Adicionar novo</span></button>
          </div>
        </div>
      </div>
      <div className="home-footer"><span>FORGE STUDIOS <b>/</b> BROWSER V1</span><span>FEITO PARA EXPLORAR <ArrowRight size={14} /></span></div>
    </div>
  );
}