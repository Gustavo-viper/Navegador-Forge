import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-neutral-300",
    ghost: "text-brand hover:bg-red-50 disabled:text-neutral-400",
    outline: "border border-neutral-300 text-neutral-800 hover:bg-neutral-100",
  }[variant];
  return (
    <button
      type="button"
      className={`rounded-xl px-4 py-3 font-semibold transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Voltar" className="-ml-2 rounded-full p-2 text-xl hover:bg-neutral-100">
          ←
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
    </header>
  );
}

export function QuantityControl({ value, onChange, max }: { value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-2 py-1">
      <button type="button" aria-label="Diminuir" onClick={() => onChange(value - 1)} className="px-2 text-xl font-bold text-brand">
        −
      </button>
      <span className="w-5 text-center font-semibold" aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label="Aumentar"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="px-2 text-xl font-bold text-brand disabled:text-neutral-300"
      >
        +
      </button>
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-sm text-brand">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-red-100";
