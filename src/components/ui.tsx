import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { ArrowUpRight, X } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export function Button({ children, variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>;
}

export function IconButton({ icon, label, active = false, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode; label: string; active?: boolean }) {
  return <button type="button" title={label} aria-label={label} className={`icon-button ${active ? 'is-active' : ''} ${className}`} {...props}>{icon}</button>;
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`forge-input ${className}`} {...props} />;
}

export function Toggle({ checked, onChange, disabled = false, label }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; label: string }) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`toggle ${checked ? 'on' : ''}`}><span /></button>;
}

export function Modal({ title, subtitle, children, onClose, size = 'normal' }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; size?: 'normal' | 'wide' }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`modal-panel ${size === 'wide' ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton icon={<X size={18} />} label="Fechar" onClick={onClose} /></div>
        {children}
      </div>
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-heading"><div><span className="eyebrow"><span className="eyebrow-line" />{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-heading-action">{action}</div>}</header>;
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button className="text-link" type="button" onClick={onClick}>{children}<ArrowUpRight size={15} /></button>;
}