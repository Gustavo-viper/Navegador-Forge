import { useState, type FormEvent } from "react";
import { formatBRL } from "../lib/money";
import type { CheckoutForm, PaymentMethod, Totals } from "../lib/types";
import { maskCep, maskPhone, validateCheckout, type FormErrors } from "../lib/validation";
import { TotalsSummary } from "./CartView";
import { Button, Field, inputClass } from "./ui";

const PAYMENTS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "💠 Pix" },
  { value: "cartao", label: "💳 Cartão na entrega" },
  { value: "dinheiro", label: "💵 Dinheiro" },
];

export function CheckoutView({
  initial, totals, onSubmit,
}: {
  initial: CheckoutForm;
  totals: Totals;
  onSubmit: (form: CheckoutForm) => void;
}) {
  const [form, setForm] = useState<CheckoutForm>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return; // evita pedido duplicado por clique duplo
    const errs = validateCheckout(form, totals.totalCents);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = Object.keys(errs)[0];
      document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    onSubmit({ ...form, name: form.name.trim(), street: form.street.trim(), number: form.number.trim(), complement: form.complement.trim() });
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-4 p-4">
      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Seus dados</h2>
        <Field label="Nome" error={errors.name}>
          <input name="name" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Telefone" error={errors.phone}>
          <input name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="(11) 91234-5678"
            value={form.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} className={inputClass} />
        </Field>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Endereço de entrega</h2>
        <Field label="CEP" error={errors.cep}>
          <input name="cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
            value={form.cep} onChange={(e) => set("cep", maskCep(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Rua" error={errors.street}>
          <input name="street" autoComplete="address-line1" value={form.street} onChange={(e) => set("street", e.target.value)} className={inputClass} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Número" error={errors.number}>
            <input name="number" value={form.number} onChange={(e) => set("number", e.target.value)} className={inputClass} />
          </Field>
          <div className="col-span-2">
            <Field label="Complemento (opcional)">
              <input name="complement" autoComplete="address-line2" value={form.complement} onChange={(e) => set("complement", e.target.value)} className={inputClass} />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Pagamento</h2>
        <div className="space-y-2" role="radiogroup" aria-label="Forma de pagamento">
          {PAYMENTS.map((p) => (
            <label key={p.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${form.payment === p.value ? "border-brand bg-red-50" : "border-neutral-200"}`}>
              <input type="radio" name="payment" value={p.value} checked={form.payment === p.value}
                onChange={() => set("payment", p.value)} className="accent-brand" />
              {p.label}
            </label>
          ))}
        </div>
        {form.payment === "dinheiro" && (
          <Field label={`Troco para (opcional) — total ${formatBRL(totals.totalCents)}`} error={errors.changeFor}>
            <input name="changeFor" inputMode="decimal" placeholder="Ex.: 100,00"
              value={form.changeFor} onChange={(e) => set("changeFor", e.target.value)} className={inputClass} />
          </Field>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <TotalsSummary totals={totals} />
      </section>

      <Button type="submit" className="w-full" disabled={submitting}>
        Fazer pedido · {formatBRL(totals.totalCents)}
      </Button>
    </form>
  );
}
