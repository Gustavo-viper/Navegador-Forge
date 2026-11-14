import { describe, expect, it } from "vitest";
import { RESTAURANTS } from "../src/data/restaurants";
import { MAX_QUANTITY, addItem, emptyCart, itemCount, sanitizeCart, setQuantity, subtotal } from "../src/lib/cart";
import { formatBRL, parseBRL } from "../src/lib/money";
import { statusAt } from "../src/lib/orderStatus";
import { COUPONS, computeTotals, validateCoupon } from "../src/lib/pricing";
import type { CheckoutForm } from "../src/lib/types";
import { maskCep, maskPhone, validateCheckout } from "../src/lib/validation";

const burger = RESTAURANTS[0]!;
const coupon = (code: string) => COUPONS.find((c) => c.code === code)!;

describe("dinheiro", () => {
  it("formata centavos", () => {
    expect(formatBRL(1990)).toBe("R$ 19,90");
    expect(formatBRL(123456)).toBe("R$ 1.234,56");
  });
  it("interpreta valores digitados", () => {
    expect(parseBRL("50")).toBe(5000);
    expect(parseBRL("50,5")).toBe(5050);
    expect(parseBRL("R$ 1.234,56")).toBe(123456);
    expect(parseBRL("0,1")).toBe(10);
    expect(parseBRL("abc")).toBeNull();
    expect(parseBRL("1,234")).toBeNull();
    expect(parseBRL("")).toBeNull();
  });
});

describe("carrinho", () => {
  it("adiciona e incrementa itens", () => {
    let c = emptyCart;
    for (let i = 0; i < 2; i++) {
      const r = addItem(c, burger.id, "bb-classico");
      if (!r.ok) throw new Error();
      c = r.cart;
    }
    expect(c.lines).toEqual([{ itemId: "bb-classico", quantity: 2 }]);
    expect(itemCount(c)).toBe(2);
    expect(subtotal(c, burger)).toBe(5780);
  });
  it("bloqueia itens de outro restaurante", () => {
    const r1 = addItem(emptyCart, burger.id, "bb-classico");
    if (!r1.ok) throw new Error();
    expect(addItem(r1.cart, "forno-nonna", "fn-margherita")).toEqual({ ok: false, reason: "other_restaurant" });
  });
  it("respeita a quantidade máxima e remove em zero", () => {
    const r = addItem(emptyCart, burger.id, "bb-classico");
    if (!r.ok) throw new Error();
    expect(setQuantity(r.cart, "bb-classico", 999).lines[0]!.quantity).toBe(MAX_QUANTITY);
    expect(setQuantity(r.cart, "bb-classico", 0)).toEqual(emptyCart);
    expect(setQuantity(r.cart, "bb-classico", -3)).toEqual(emptyCart);
  });
  it("sanitiza dados corrompidos do armazenamento", () => {
    expect(sanitizeCart(null, RESTAURANTS)).toEqual(emptyCart);
    expect(sanitizeCart("lixo", RESTAURANTS)).toEqual(emptyCart);
    expect(sanitizeCart({ restaurantId: "nao-existe", lines: [] }, RESTAURANTS)).toEqual(emptyCart);
    expect(
      sanitizeCart(
        { restaurantId: burger.id, lines: [{ itemId: "bb-bacon", quantity: 2 }, { itemId: "fantasma", quantity: 1 }, { itemId: "bb-refri", quantity: 1.5 }, null] },
        RESTAURANTS,
      ),
    ).toEqual({ restaurantId: burger.id, lines: [{ itemId: "bb-bacon", quantity: 2 }] });
  });
});

describe("preços e cupons", () => {
  it("sem itens não cobra entrega", () => {
    expect(computeTotals(0, 599, null).totalCents).toBe(0);
  });
  it("aplica percentual com arredondamento", () => {
    const t = computeTotals(2895, 599, coupon("BEMVINDO10"));
    expect(t.discountCents).toBe(290);
    expect(t.totalCents).toBe(2895 - 290 + 599);
  });
  it("frete grátis zera a taxa", () => {
    const t = computeTotals(3500, 599, coupon("FRETEGRATIS"));
    expect(t).toEqual({ subtotalCents: 3500, deliveryFeeCents: 0, discountCents: 0, totalCents: 3500 });
  });
  it("ignora cupom se o subtotal cair abaixo do mínimo", () => {
    expect(computeTotals(5000, 500, coupon("DESCONTO15")).discountCents).toBe(0);
    expect(computeTotals(6000, 500, coupon("DESCONTO15")).totalCents).toBe(5000);
  });
  it("valida códigos", () => {
    expect(validateCoupon(" bemvindo10 ", 2500).ok).toBe(true);
    expect(validateCoupon("XYZ", 9999)).toEqual({ ok: false, message: "Cupom inválido." });
    expect(validateCoupon("", 9999).ok).toBe(false);
    const r = validateCoupon("DESCONTO15", 1000);
    expect(r.ok === false && r.message).toContain("R$ 60,00");
  });
});

describe("checkout", () => {
  const ok: CheckoutForm = {
    name: "Ana Souza", phone: "(11) 91234-5678", cep: "01310-100", street: "Av. Paulista",
    number: "1000", complement: "", payment: "pix", changeFor: "",
  };
  it("aceita formulário válido", () => expect(validateCheckout(ok, 5000)).toEqual({}));
  it("aponta campos inválidos", () => {
    const e = validateCheckout({ ...ok, name: " A ", phone: "123", cep: "0131", street: "", number: " " }, 5000);
    expect(Object.keys(e).sort()).toEqual(["cep", "name", "number", "phone", "street"]);
  });
  it("valida troco", () => {
    expect(validateCheckout({ ...ok, payment: "dinheiro", changeFor: "40" }, 5000).changeFor).toBeDefined();
    expect(validateCheckout({ ...ok, payment: "dinheiro", changeFor: "abc" }, 5000).changeFor).toBe("Valor inválido.");
    expect(validateCheckout({ ...ok, payment: "dinheiro", changeFor: "100,00" }, 5000)).toEqual({});
    expect(validateCheckout({ ...ok, payment: "dinheiro", changeFor: "" }, 5000)).toEqual({});
  });
  it("aplica máscaras", () => {
    expect(maskPhone("11912345678")).toBe("(11) 91234-5678");
    expect(maskPhone("1132345678")).toBe("(11) 3234-5678");
    expect(maskPhone("119123456789999")).toBe("(11) 91234-5678");
    expect(maskPhone("")).toBe("");
    expect(maskCep("01310100")).toBe("01310-100");
    expect(maskCep("abc0131")).toBe("0131");
  });
});

describe("status do pedido", () => {
  it("avança com o tempo", () => {
    expect(statusAt(0, 0)).toBe("confirmado");
    expect(statusAt(0, 10_000)).toBe("preparando");
    expect(statusAt(0, 30_000)).toBe("a_caminho");
    expect(statusAt(0, 999_999)).toBe("entregue");
    expect(statusAt(10_000, 0)).toBe("confirmado");
  });
});

describe("catálogo", () => {
  it("tem ids únicos e preços inteiros positivos", () => {
    const ids = RESTAURANTS.flatMap((r) => r.menu.map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(RESTAURANTS.map((r) => r.id)).size).toBe(RESTAURANTS.length);
    for (const r of RESTAURANTS) for (const m of r.menu) expect(Number.isInteger(m.priceCents) && m.priceCents > 0).toBe(true);
  });
});
