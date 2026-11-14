import { parseBRL } from "./money";
import type { CheckoutForm } from "./types";

export type FormErrors = Partial<Record<keyof CheckoutForm, string>>;

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function validateCheckout(form: CheckoutForm, totalCents: number): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim().length < 3) errors.name = "Informe seu nome completo.";
  const phone = onlyDigits(form.phone);
  if (phone.length < 10 || phone.length > 11) errors.phone = "Telefone inválido. Use DDD + número.";
  if (onlyDigits(form.cep).length !== 8) errors.cep = "CEP deve ter 8 dígitos.";
  if (form.street.trim().length < 3) errors.street = "Informe a rua.";
  if (!form.number.trim()) errors.number = "Informe o número (ou \"S/N\").";
  if (form.payment === "dinheiro" && form.changeFor.trim()) {
    const change = parseBRL(form.changeFor);
    if (change === null) errors.changeFor = "Valor inválido.";
    else if (change < totalCents) errors.changeFor = "O troco deve ser maior ou igual ao total.";
  }
  return errors;
}
