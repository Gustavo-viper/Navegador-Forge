import { useState } from "react";
import { MAX_QUANTITY } from "../lib/cart";
import { formatBRL } from "../lib/money";
import { validateCoupon } from "../lib/pricing";
import type { Cart, Coupon, Restaurant, Totals } from "../lib/types";
import { Button, QuantityControl, inputClass } from "./ui";

export function TotalsSummary({ totals }: { totals: Totals }) {
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(totals.subtotalCents)}</dd></div>
      <div className="flex justify-between">
        <dt>Taxa de entrega</dt>
        <dd>{totals.deliveryFeeCents === 0 ? <span className="text-green-600">Grátis</span> : formatBRL(totals.deliveryFeeCents)}</dd>
      </div>
      {totals.discountCents > 0 && (
        <div className="flex justify-between text-green-600"><dt>Desconto</dt><dd>− {formatBRL(totals.discountCents)}</dd></div>
      )}
      <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold">
        <dt>Total</dt><dd>{formatBRL(totals.totalCents)}</dd>
      </div>
    </dl>
  );
}

export function CartView({
  cart, restaurant, totals, coupon, onSetQuantity, onCoupon, onClear, onCheckout, onBrowse,
}: {
  cart: Cart;
  restaurant: Restaurant | undefined;
  totals: Totals;
  coupon: Coupon | null;
  onSetQuantity: (itemId: string, q: number) => void;
  onCoupon: (c: Coupon | null) => void;
  onClear: () => void;
  onCheckout: () => void;
  onBrowse: () => void;
}) {
  const [code, setCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!restaurant || cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <span className="text-6xl">🛒</span>
        <p className="text-neutral-500">Seu carrinho está vazio.</p>
        <Button onClick={onBrowse}>Ver restaurantes</Button>
      </div>
    );
  }

  const missing = restaurant.minOrderCents - totals.subtotalCents;

  const apply = () => {
    const r = validateCoupon(code, totals.subtotalCents);
    if (r.ok) {
      onCoupon(r.coupon);
      setCouponMsg({ ok: true, text: `Cupom ${r.coupon.code} aplicado!` });
    } else {
      setCouponMsg({ ok: false, text: r.message });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{restaurant.name}</h2>
        <Button variant="ghost" className="px-2 py-1 text-sm" onClick={onClear}>Limpar</Button>
      </div>
      <ul className="space-y-3">
        {cart.lines.map((line) => {
          const item = restaurant.menu.find((m) => m.id === line.itemId);
          if (!item) return null;
          return (
            <li key={line.itemId} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="text-3xl">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-neutral-500">{formatBRL(item.priceCents * line.quantity)}</p>
              </div>
              <QuantityControl value={line.quantity} max={MAX_QUANTITY} onChange={(v) => onSetQuantity(item.id, v)} />
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-medium">Cupom de desconto</p>
        {coupon ? (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-green-600">🎟️ {coupon.code}</span>
            <Button variant="ghost" className="px-2 py-1 text-sm" onClick={() => { onCoupon(null); setCouponMsg(null); }}>
              Remover
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Ex.: BEMVINDO10"
              aria-label="Código do cupom"
              className={inputClass}
            />
            <Button variant="outline" onClick={apply}>Aplicar</Button>
          </div>
        )}
        {couponMsg && (
          <p role="status" className={`mt-2 text-sm ${couponMsg.ok ? "text-green-600" : "text-brand"}`}>{couponMsg.text}</p>
        )}
        {coupon && totals.subtotalCents < coupon.minSubtotalCents && (
          <p className="mt-2 text-sm text-amber-600">O subtotal ficou abaixo do mínimo deste cupom; ele não está sendo aplicado.</p>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <TotalsSummary totals={totals} />
      </div>

      {missing > 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Faltam {formatBRL(missing)} para atingir o pedido mínimo de {formatBRL(restaurant.minOrderCents)}.
        </p>
      )}
      <Button className="w-full" disabled={missing > 0} onClick={onCheckout}>
        Continuar
      </Button>
    </div>
  );
}
