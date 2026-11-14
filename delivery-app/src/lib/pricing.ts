import type { Coupon, Totals } from "./types";

export const COUPONS: Coupon[] = [
  { code: "BEMVINDO10", kind: "percent", value: 10, minSubtotalCents: 2000 },
  { code: "FRETEGRATIS", kind: "free_delivery", value: 0, minSubtotalCents: 3000 },
  { code: "DESCONTO15", kind: "fixed", value: 1500, minSubtotalCents: 6000 },
];

export type CouponResult = { ok: true; coupon: Coupon } | { ok: false; message: string };

export function validateCoupon(code: string, subtotalCents: number): CouponResult {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, message: "Digite um cupom." };
  const coupon = COUPONS.find((c) => c.code === normalized);
  if (!coupon) return { ok: false, message: "Cupom inválido." };
  if (subtotalCents < coupon.minSubtotalCents) {
    const min = (coupon.minSubtotalCents / 100).toFixed(2).replace(".", ",");
    return { ok: false, message: `Cupom válido para pedidos a partir de R$ ${min}.` };
  }
  return { ok: true, coupon };
}

/** Calcula os totais. O desconto nunca passa do subtotal e o total nunca é negativo. */
export function computeTotals(
  subtotalCents: number,
  deliveryFeeCents: number,
  coupon: Coupon | null,
): Totals {
  let discountCents = 0;
  let fee = subtotalCents > 0 ? deliveryFeeCents : 0;
  const applicable = coupon && subtotalCents >= coupon.minSubtotalCents ? coupon : null;
  if (applicable?.kind === "percent") {
    discountCents = Math.round((subtotalCents * applicable.value) / 100);
  } else if (applicable?.kind === "fixed") {
    discountCents = Math.min(applicable.value, subtotalCents);
  } else if (applicable?.kind === "free_delivery") {
    fee = 0;
  }
  const totalCents = Math.max(0, subtotalCents - discountCents + fee);
  return { subtotalCents, deliveryFeeCents: fee, discountCents, totalCents };
}
