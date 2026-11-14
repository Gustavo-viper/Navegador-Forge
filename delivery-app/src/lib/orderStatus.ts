import type { OrderStatus } from "./types";

export const STATUS_STEPS: { status: OrderStatus; label: string; atSeconds: number }[] = [
  { status: "confirmado", label: "Pedido confirmado", atSeconds: 0 },
  { status: "preparando", label: "Em preparo", atSeconds: 10 },
  { status: "a_caminho", label: "Saiu para entrega", atSeconds: 25 },
  { status: "entregue", label: "Entregue", atSeconds: 45 },
];

/** Status simulado a partir do tempo decorrido desde a criação do pedido. */
export function statusAt(createdAt: number, now: number): OrderStatus {
  const elapsed = Math.max(0, (now - createdAt) / 1000);
  let current: OrderStatus = "confirmado";
  for (const step of STATUS_STEPS) if (elapsed >= step.atSeconds) current = step.status;
  return current;
}

export function stepIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex((s) => s.status === status);
}
