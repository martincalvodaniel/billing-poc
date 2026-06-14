import type { Payment, PaymentFormData } from "@/lib/domain/entities/payment"

/**
 * Builds a `PaymentFormData` seed for duplicating an existing payment.
 * Copies type/date/tag/vat/surcharge/concepts (concepts deep-cloned) and
 * blanks fields that must not carry over (client, discount, payment method,
 * delivery note ref).
 */
export function buildDuplicateSeed(payment: Payment): PaymentFormData {
  return {
    type: payment.type,
    date: payment.date,
    concepts: payment.concepts.map((c) => ({
      name: c.name,
      amount: c.amount,
      quantity: c.quantity,
    })),
    vat: payment.vat.toString(),
    surcharge: payment.surcharge?.toString() ?? "",
    discount: "",
    tag: payment.tag ?? "",
    clientId: undefined,
    deliveryNoteRef: "",
    paymentMethod: "",
  }
}

/**
 * Builds a `PaymentFormData` seed for editing an existing payment, mirroring
 * every stored field (with sensible defaults for optional ones).
 */
export function buildEditFormData(payment: Payment): PaymentFormData {
  return {
    type: payment.type,
    date: payment.date,
    concepts: payment.concepts || [{ name: "", amount: 0, quantity: 1 }],
    vat: payment.vat.toString(),
    surcharge: payment.surcharge?.toString() || "",
    discount: payment.discount?.toString() || "",
    tag: payment.tag || "",
    clientId: payment.clientId || undefined,
    deliveryNoteRef: payment.deliveryNoteRef || "",
    paymentMethod: payment.paymentMethod ?? "",
  }
}
