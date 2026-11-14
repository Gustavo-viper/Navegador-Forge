const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata centavos inteiros como moeda brasileira (ex.: 1990 -> "R$ 19,90"). */
export function formatBRL(cents: number): string {
  return formatter.format(cents / 100).replace(/ /g, " ");
}

/** Converte texto digitado ("50", "50,5", "R$ 1.234,56") em centavos. Retorna null se inválido. */
export function parseBRL(input: string): number | null {
  const cleaned = input.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}
