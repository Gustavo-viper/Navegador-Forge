import { MAX_QUANTITY } from "../lib/cart";
import { formatBRL } from "../lib/money";
import type { Cart, Restaurant } from "../lib/types";
import { QuantityControl } from "./ui";

export function RestaurantView({
  restaurant,
  cart,
  onAdd,
  onSetQuantity,
}: {
  restaurant: Restaurant;
  cart: Cart;
  onAdd: (itemId: string) => void;
  onSetQuantity: (itemId: string, q: number) => void;
}) {
  const qtyOf = (id: string) =>
    cart.restaurantId === restaurant.id ? (cart.lines.find((l) => l.itemId === id)?.quantity ?? 0) : 0;

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-5xl">{restaurant.emoji}</div>
        <p className="mt-2 text-sm text-neutral-500">
          ⭐ {restaurant.rating.toFixed(1)} · {restaurant.etaMin}-{restaurant.etaMax} min ·{" "}
          {restaurant.deliveryFeeCents === 0 ? "Entrega grátis" : `Entrega ${formatBRL(restaurant.deliveryFeeCents)}`}
        </p>
        <p className="text-sm text-neutral-500">Pedido mínimo {formatBRL(restaurant.minOrderCents)}</p>
      </div>
      <h2 className="text-lg font-bold">Cardápio</h2>
      <ul className="space-y-3">
        {restaurant.menu.map((item) => {
          const q = qtyOf(item.id);
          return (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-3xl">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-neutral-500">{item.description}</p>
                <p className="mt-1 font-semibold">{formatBRL(item.priceCents)}</p>
              </div>
              {q > 0 ? (
                <QuantityControl value={q} max={MAX_QUANTITY} onChange={(v) => onSetQuantity(item.id, v)} />
              ) : (
                <button
                  type="button"
                  onClick={() => onAdd(item.id)}
                  aria-label={`Adicionar ${item.name}`}
                  className="rounded-xl bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
                >
                  Adicionar
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
