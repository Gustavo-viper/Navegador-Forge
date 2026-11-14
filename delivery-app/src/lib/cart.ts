import type { Cart, Restaurant } from "./types";

export const MAX_QUANTITY = 20;
export const emptyCart: Cart = { restaurantId: null, lines: [] };

export type AddResult = { ok: true; cart: Cart } | { ok: false; reason: "other_restaurant" };

/** Adiciona um item. O carrinho aceita apenas um restaurante por vez. */
export function addItem(cart: Cart, restaurantId: string, itemId: string): AddResult {
  if (cart.restaurantId && cart.restaurantId !== restaurantId && cart.lines.length > 0) {
    return { ok: false, reason: "other_restaurant" };
  }
  const existing = cart.lines.find((l) => l.itemId === itemId);
  const lines = existing
    ? cart.lines.map((l) =>
        l.itemId === itemId ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + 1) } : l,
      )
    : [...cart.lines, { itemId, quantity: 1 }];
  return { ok: true, cart: { restaurantId, lines } };
}

/** Define a quantidade de um item; quantidade <= 0 remove a linha. */
export function setQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  const q = Math.min(MAX_QUANTITY, Math.floor(quantity));
  const lines =
    q <= 0
      ? cart.lines.filter((l) => l.itemId !== itemId)
      : cart.lines.map((l) => (l.itemId === itemId ? { ...l, quantity: q } : l));
  return lines.length === 0 ? emptyCart : { ...cart, lines };
}

export function itemCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function subtotal(cart: Cart, restaurant: Restaurant | undefined): number {
  if (!restaurant) return 0;
  return cart.lines.reduce((sum, l) => {
    const item = restaurant.menu.find((m) => m.id === l.itemId);
    return item ? sum + item.priceCents * l.quantity : sum;
  }, 0);
}

/** Remove linhas inválidas (itens que não existem mais no cardápio) — útil ao restaurar do armazenamento. */
export function sanitizeCart(cart: unknown, restaurants: Restaurant[]): Cart {
  if (!cart || typeof cart !== "object") return emptyCart;
  const c = cart as Partial<Cart>;
  const restaurant = restaurants.find((r) => r.id === c.restaurantId);
  if (!restaurant || !Array.isArray(c.lines)) return emptyCart;
  const lines = c.lines
    .filter(
      (l): l is { itemId: string; quantity: number } =>
        !!l &&
        typeof l.itemId === "string" &&
        Number.isInteger(l.quantity) &&
        l.quantity > 0 &&
        restaurant.menu.some((m) => m.id === l.itemId),
    )
    .map((l) => ({ itemId: l.itemId, quantity: Math.min(MAX_QUANTITY, l.quantity) }));
  return lines.length ? { restaurantId: restaurant.id, lines } : emptyCart;
}
