import type { CSSProperties } from 'react';

export function ForgeMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  const style: CSSProperties = { width: size, height: size };
  return <img className={`forge-mark ${className}`} src={new URL(`./icons/forge-app.png`, window.location.href).href} style={style} alt="" draggable={false} />;
}

export function ForgeWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`forge-wordmark ${compact ? 'compact' : ''}`}>
      <ForgeMark size={compact ? 29 : 33} />
      <span>FORGE <em>BROWSER</em></span>
    </div>
  );
}