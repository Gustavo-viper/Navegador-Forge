import { useEffect, useState } from "react";
import { formatBRL, parseBRL } from "../lib/money";
import { STATUS_STEPS, statusAt, stepIndex } from "../lib/orderStatus";
import type { Order } from "../lib/types";
import { TotalsSummary } from "./CartView";
import { Button } from "./ui";

const PAYMENT_LABEL = { pix: "Pix", cartao: "Cartão na entrega", dinheiro: "Dinheiro" } as const;

export function TrackingView({ order, onHome }: { order: Order; onHome: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const status = statusAt(order.createdAt, now);
  const current = stepIndex(status);

  useEffect(() => {
    if (status === "entregue") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [status]);

  const change = order.customer.payment === "dinheiro" ? parseBRL(order.customer.changeFor) : null;

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
        <div className="text-5xl">{status === "entregue" ? "✅" : status === "a_caminho" ? "🛵" : "👨‍🍳"}</div>
        <p className="mt-2 text-lg font-bold" aria-live="polite">{STATUS_STEPS[current]?.label}</p>
        <p className="text-sm text-neutral-500">Pedido #{order.id} · {order.restaurantName}</p>
      </div>

      <ol className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        {STATUS_STEPS.map((step, i) => (
          <li key={step.status} className="flex items-center gap-3">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${i <= current ? "bg-brand text-white" : "bg-neutral-200 text-neutral-500"}`}>
              {i < current ? "✓" : i + 1}
            </span>
            <span className={i <= current ? "font-semibold" : "text-neutral-400"}>{step.label}</span>
          </li>
        ))}
      </ol>

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Resumo</h2>
        <ul className="space-y-1 text-sm">
          {order.lines.map((l) => (
            <li key={l.name} className="flex justify-between">
              <span>{l.quantity}× {l.name}</span><span>{formatBRL(l.unitCents * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <TotalsSummary totals={order.totals} />
        <p className="text-sm text-neutral-600">
          Entrega em: {order.customer.street}, {order.customer.number}
          {order.customer.complement && ` — ${order.customer.complement}`} · CEP {order.customer.cep}
        </p>
        <p className="text-sm text-neutral-600">
          Pagamento: {PAYMENT_LABEL[order.customer.payment]}
          {change !== null && change > order.totals.totalCents && ` · troco para ${formatBRL(change)} (devolver ${formatBRL(change - order.totals.totalCents)})`}
        </p>
      </div>
      <Button variant="outline" className="w-full" onClick={onHome}>Voltar ao início</Button>
    </div>
  );
}
