import type { Category, Restaurant } from "../lib/types";

export const CATEGORIES: { name: Category; emoji: string }[] = [
  { name: "Lanches", emoji: "🍔" },
  { name: "Pizza", emoji: "🍕" },
  { name: "Japonesa", emoji: "🍣" },
  { name: "Brasileira", emoji: "🍛" },
  { name: "Doces", emoji: "🍰" },
  { name: "Saudável", emoji: "🥗" },
];

export const RESTAURANTS: Restaurant[] = [
  {
    id: "brasa-burger", name: "Brasa Burger", category: "Lanches", emoji: "🍔",
    rating: 4.8, etaMin: 25, etaMax: 35, deliveryFeeCents: 599, minOrderCents: 2000,
    menu: [
      { id: "bb-classico", name: "Clássico", description: "Pão brioche, blend 160g, queijo e molho da casa", priceCents: 2890, emoji: "🍔" },
      { id: "bb-bacon", name: "Bacon Duplo", description: "Dois blends, cheddar e bacon crocante", priceCents: 3690, emoji: "🥓" },
      { id: "bb-batata", name: "Batata Rústica", description: "Porção 300g com páprica", priceCents: 1590, emoji: "🍟" },
      { id: "bb-refri", name: "Refrigerante Lata", description: "350ml", priceCents: 650, emoji: "🥤" },
    ],
  },
  {
    id: "forno-nonna", name: "Forno da Nonna", category: "Pizza", emoji: "🍕",
    rating: 4.6, etaMin: 35, etaMax: 50, deliveryFeeCents: 0, minOrderCents: 3500,
    menu: [
      { id: "fn-margherita", name: "Margherita", description: "Molho de tomate, muçarela de búfala e manjericão", priceCents: 5490, emoji: "🍕" },
      { id: "fn-calabresa", name: "Calabresa", description: "Calabresa fatiada, cebola e azeitonas", priceCents: 5290, emoji: "🧅" },
      { id: "fn-quatro", name: "Quatro Queijos", description: "Muçarela, provolone, parmesão e gorgonzola", priceCents: 5990, emoji: "🧀" },
      { id: "fn-suco", name: "Suco Natural 500ml", description: "Laranja ou limão", priceCents: 990, emoji: "🍊" },
    ],
  },
  {
    id: "sakura", name: "Sakura Sushi", category: "Japonesa", emoji: "🍣",
    rating: 4.9, etaMin: 40, etaMax: 55, deliveryFeeCents: 899, minOrderCents: 4000,
    menu: [
      { id: "sk-combo20", name: "Combo 20 peças", description: "Sashimi, uramaki e hossomaki", priceCents: 6990, emoji: "🍱" },
      { id: "sk-temaki", name: "Temaki Salmão", description: "Salmão fresco e cebolinha", priceCents: 3290, emoji: "🍙" },
      { id: "sk-gyoza", name: "Guioza (6un)", description: "Recheio de carne suína", priceCents: 2490, emoji: "🥟" },
    ],
  },
  {
    id: "sabor-casa", name: "Sabor de Casa", category: "Brasileira", emoji: "🍛",
    rating: 4.7, etaMin: 30, etaMax: 40, deliveryFeeCents: 499, minOrderCents: 1500,
    menu: [
      { id: "sc-feijoada", name: "Feijoada Individual", description: "Arroz, couve, farofa e laranja", priceCents: 3490, emoji: "🍲" },
      { id: "sc-pf", name: "PF de Frango", description: "Arroz, feijão, salada e filé grelhado", priceCents: 2690, emoji: "🍗" },
      { id: "sc-pudim", name: "Pudim de Leite", description: "Fatia generosa", priceCents: 1190, emoji: "🍮" },
    ],
  },
  {
    id: "doce-mel", name: "Doce Mel Confeitaria", category: "Doces", emoji: "🍰",
    rating: 4.5, etaMin: 20, etaMax: 30, deliveryFeeCents: 399, minOrderCents: 1000,
    menu: [
      { id: "dm-brigadeiro", name: "Caixa de Brigadeiros (12un)", description: "Gourmet, sabores sortidos", priceCents: 3200, emoji: "🍫" },
      { id: "dm-bolo", name: "Fatia Bolo de Cenoura", description: "Com cobertura de chocolate", priceCents: 1490, emoji: "🍰" },
      { id: "dm-acai", name: "Açaí 500ml", description: "Com granola e banana", priceCents: 2190, emoji: "🍇" },
    ],
  },
  {
    id: "verde-vida", name: "Verde Vida", category: "Saudável", emoji: "🥗",
    rating: 4.4, etaMin: 20, etaMax: 35, deliveryFeeCents: 699, minOrderCents: 2500,
    menu: [
      { id: "vv-salada", name: "Salada Caesar", description: "Alface, frango, parmesão e croutons", priceCents: 2990, emoji: "🥗" },
      { id: "vv-bowl", name: "Poke Bowl", description: "Arroz, salmão, manga e edamame", priceCents: 4290, emoji: "🥙" },
      { id: "vv-detox", name: "Suco Detox", description: "Couve, limão e gengibre — 400ml", priceCents: 1290, emoji: "🥬" },
    ],
  },
];

export function findRestaurant(id: string | null): Restaurant | undefined {
  return RESTAURANTS.find((r) => r.id === id);
}
