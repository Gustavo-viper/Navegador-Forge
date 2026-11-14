import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CartView } from "./components/CartView";
import { CheckoutView } from "./components/CheckoutView";
import { HomeView } from "./components/HomeView";
import { RestaurantView } from "./components/RestaurantView";
import { TrackingView } from "./components/TrackingView";
import { Button, Header } from "./components/ui";
import { RESTAURANTS, findRestaurant } from "./data/restaurants";
import { addItem, emptyCart, itemCount, sanitizeCart, setQuantity, subtotal } from "./lib/cart";
import { formatBRL } from "./lib/money";
import { STATUS_STEPS, statusAt, stepIndex } from "./lib/orderStatus";
import { COUPONS, computeTotals } from "./lib/pricing";
import { load, save } from "./lib/storage";
import type { Cart, CheckoutForm, Coupon, Order } from "./lib/types";

type View =
  | { name: "home" }
  | { name: "restaurant"; id: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "tracking"; orderId: string }
  | { name: "orders" };

const blankForm: CheckoutForm = { name: "", phone: "", cep: "", street: "", number: "", complement: "", payment: "pix", changeFor: "" };

function loadOrders(): Order[] {
  const raw = load("delivery:orders", []);
  return Array.isArray(raw) ? (raw as Order[]).filter((o) => o && typeof o.id === "string" && o.totals) : [];
}

function loadForm(): CheckoutForm {
  const raw = load("delivery:customer", null);
  return raw && typeof raw === "object" ? { ...blankForm, ...(raw as Partial<CheckoutForm>), changeFor: "" } : blankForm;
}

function loadCoupon(): Coupon | null {
  const code = load("delivery:coupon", null);
  return COUPONS.find((c) => c.code === code) ?? null;
}

function newOrderId(): string {
  const rand = Math.floor(Math.random() * 1296).toString(36).padStart(2, "0");
  return (Date.now().toString(36).slice(-4) + rand).toUpperCase();
}

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });
  const [cart, setCart] = useState<Cart>(() => sanitizeCart(load("delivery:cart", null), RESTAURANTS));
  const [coupon, setCoupon] = useState<Coupon | null>(loadCoupon);
  const [orders, setOrders] = useState<Order[]>(loadOrders);
  const [savedForm, setSavedForm] = useState<CheckoutForm>(loadForm);
  const [pendingAdd, setPendingAdd] = useState<{ restaurantId: string; itemId: string } | null>(null);

  // Corpos com chaves: um efeito nunca deve retornar valor (ex.: scrollTo retorna Promise no Chromium recente).
  useEffect(() => { save("delivery:cart", cart); }, [cart]);
  useEffect(() => { save("delivery:coupon", coupon?.code ?? null); }, [coupon]);
  useEffect(() => { save("delivery:orders", orders); }, [orders]);
  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  const cartRestaurant = findRestaurant(cart.restaurantId);
  const totals = useMemo(
    () => computeTotals(subtotal(cart, cartRestaurant), cartRestaurant?.deliveryFeeCents ?? 0, coupon),
    [cart, cartRestaurant, coupon],
  );
  const count = itemCount(cart);

  const handleAdd = (restaurantId: string, itemId: string) => {
    const r = addItem(cart, restaurantId, itemId);
    if (r.ok) setCart(r.cart);
    else setPendingAdd({ restaurantId, itemId });
  };

  const handleSetQuantity = (itemId: string, q: number) => setCart((c) => setQuantity(c, itemId, q));

  const clearCart = () => {
    setCart(emptyCart);
    setCoupon(null);
  };

  const placeOrder = (form: CheckoutForm) => {
    if (!cartRestaurant || cart.lines.length === 0) return;
    const order: Order = {
      id: newOrderId(),
      restaurantId: cartRestaurant.id,
      restaurantName: cartRestaurant.name,
      lines: cart.lines.flatMap((l) => {
        const item = cartRestaurant.menu.find((m) => m.id === l.itemId);
        return item ? [{ name: item.name, quantity: l.quantity, unitCents: item.priceCents }] : [];
      }),
      totals,
      customer: form,
      createdAt: Date.now(),
    };
    setOrders((o) => [order, ...o]);
    save("delivery:customer", { ...form, changeFor: "" });
    setSavedForm({ ...form, changeFor: "" });
    clearCart();
    setView({ name: "tracking", orderId: order.id });
  };

  const goHome = () => setView({ name: "home" });
  const cartButton = (
    <button type="button" onClick={() => setView({ name: "cart" })} aria-label={`Carrinho, ${count} itens`}
      className="relative rounded-full p-2 text-2xl hover:bg-neutral-100">
      🛒
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );

  let title = "Forge Delivery";
  let back: (() => void) | undefined;
  let body: ReactNode;

  switch (view.name) {
    case "home":
      body = <HomeView onOpen={(id) => setView({ name: "restaurant", id })} />;
      break;
    case "restaurant": {
      const r = findRestaurant(view.id);
      if (!r) { body = <p className="p-6">Restaurante não encontrado.</p>; back = goHome; break; }
      title = r.name;
      back = goHome;
      body = (
        <RestaurantView restaurant={r} cart={cart} onAdd={(itemId) => handleAdd(r.id, itemId)} onSetQuantity={handleSetQuantity} />
      );
      break;
    }
    case "cart":
      title = "Carrinho";
      back = cartRestaurant ? () => setView({ name: "restaurant", id: cartRestaurant.id }) : goHome;
      body = (
        <CartView cart={cart} restaurant={cartRestaurant} totals={totals} coupon={coupon}
          onSetQuantity={handleSetQuantity} onCoupon={setCoupon} onClear={clearCart}
          onCheckout={() => setView({ name: "checkout" })} onBrowse={goHome} />
      );
      break;
    case "checkout":
      title = "Finalizar pedido";
      back = () => setView({ name: "cart" });
      body =
        cartRestaurant && cart.lines.length > 0 && totals.subtotalCents >= cartRestaurant.minOrderCents ? (
          <CheckoutView initial={savedForm} totals={totals} onSubmit={placeOrder} />
        ) : (
          <div className="p-6 text-center"><Button onClick={() => setView({ name: "cart" })}>Voltar ao carrinho</Button></div>
        );
      break;
    case "tracking": {
      const order = orders.find((o) => o.id === view.orderId);
      title = "Acompanhar pedido";
      back = () => setView({ name: "orders" });
      body = order ? <TrackingView order={order} onHome={goHome} /> : <p className="p-6">Pedido não encontrado.</p>;
      break;
    }
    case "orders":
      title = "Meus pedidos";
      back = goHome;
      body = orders.length === 0 ? (
        <p className="p-10 text-center text-neutral-500">Você ainda não fez pedidos.</p>
      ) : (
        <ul className="space-y-3 p-4">
          {orders.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => setView({ name: "tracking", orderId: o.id })}
                className="w-full rounded-2xl bg-white p-4 text-left shadow-sm hover:shadow-md">
                <div className="flex justify-between font-semibold"><span>{o.restaurantName}</span><span>{formatBRL(o.totals.totalCents)}</span></div>
                <div className="text-sm text-neutral-500">
                  #{o.id} · {new Date(o.createdAt).toLocaleString("pt-BR")} · {STATUS_STEPS[stepIndex(statusAt(o.createdAt, Date.now()))]?.label}
                </div>
              </button>
            </li>
          ))}
        </ul>
      );
      break;
  }

  const showCartBar = count > 0 && (view.name === "home" || view.name === "restaurant");

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-neutral-50 pb-28">
      <Header title={title} onBack={back} right={
        <div className="flex items-center">
          {view.name === "home" && (
            <button type="button" onClick={() => setView({ name: "orders" })} aria-label="Meus pedidos" className="rounded-full p-2 text-2xl hover:bg-neutral-100">🧾</button>
          )}
          {cartButton}
        </div>
      } />
      <main>{body}</main>

      {showCartBar && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-lg p-4">
          <Button className="flex w-full justify-between shadow-lg" onClick={() => setView({ name: "cart" })}>
            <span>Ver carrinho ({count})</span><span>{formatBRL(totals.totalCents)}</span>
          </Button>
        </div>
      )}

      {pendingAdd && (
        <div role="dialog" aria-modal="true" aria-labelledby="switch-title" className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5">
            <h2 id="switch-title" className="text-lg font-bold">Trocar de restaurante?</h2>
            <p className="text-neutral-600">
              Seu carrinho tem itens de {cartRestaurant?.name}. Para adicionar este item, o carrinho atual será esvaziado.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPendingAdd(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => {
                const r = addItem(emptyCart, pendingAdd.restaurantId, pendingAdd.itemId);
                if (r.ok) setCart(r.cart);
                setCoupon(null);
                setPendingAdd(null);
              }}>Esvaziar e adicionar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
