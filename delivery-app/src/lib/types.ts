export type Category = "Lanches" | "Pizza" | "Japonesa" | "Brasileira" | "Doces" | "Saudável";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  emoji: string;
}

export interface Restaurant {
  id: string;
  name: string;
  category: Category;
  emoji: string;
  rating: number;
  etaMin: number;
  etaMax: number;
  deliveryFeeCents: number;
  minOrderCents: number;
  menu: MenuItem[];
}

export interface CartLine {
  itemId: string;
  quantity: number;
}

export interface Cart {
  restaurantId: string | null;
  lines: CartLine[];
}

export type PaymentMethod = "pix" | "cartao" | "dinheiro";

export interface CheckoutForm {
  name: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  payment: PaymentMethod;
  changeFor: string;
}

export type OrderStatus = "confirmado" | "preparando" | "a_caminho" | "entregue";

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  lines: { name: string; quantity: number; unitCents: number }[];
  totals: Totals;
  customer: CheckoutForm;
  createdAt: number;
}

export interface Totals {
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
}

export interface Coupon {
  code: string;
  kind: "percent" | "fixed" | "free_delivery";
  value: number;
  minSubtotalCents: number;
}
