import { useMemo, useState } from "react";
import { CATEGORIES, RESTAURANTS } from "../data/restaurants";
import { formatBRL } from "../lib/money";
import type { Category } from "../lib/types";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function HomeView({ onOpen }: { onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return RESTAURANTS.filter(
      (r) =>
        (!category || r.category === category) &&
        (!q || normalize(r.name).includes(q) || r.menu.some((m) => normalize(m.name).includes(q))),
    );
  }, [query, category]);

  return (
    <div className="space-y-5 p-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar restaurante ou prato"
        aria-label="Buscar"
        className="w-full rounded-xl bg-neutral-100 px-4 py-3 outline-none focus:ring-2 focus:ring-red-100"
      />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((c) => {
          const active = category === c.name;
          return (
            <button
              key={c.name}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(active ? null : c.name)}
              className={`flex min-w-20 flex-col items-center rounded-2xl px-3 py-2 text-sm ${active ? "bg-brand text-white" : "bg-white shadow-sm"}`}
            >
              <span className="text-2xl">{c.emoji}</span>
              {c.name}
            </button>
          );
        })}
      </div>
      <section>
        <h2 className="mb-3 text-lg font-bold">Restaurantes</h2>
        {results.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-neutral-500">Nenhum resultado encontrado.</p>
        ) : (
          <ul className="space-y-3">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onOpen(r.id)}
                  className="flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm hover:shadow-md"
                >
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-red-50 text-4xl">{r.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="block text-sm text-neutral-500">
                      ⭐ {r.rating.toFixed(1)} · {r.category} · {r.etaMin}-{r.etaMax} min
                    </span>
                    <span className={`block text-sm ${r.deliveryFeeCents === 0 ? "font-semibold text-green-600" : "text-neutral-500"}`}>
                      {r.deliveryFeeCents === 0 ? "Entrega grátis" : `Entrega ${formatBRL(r.deliveryFeeCents)}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
