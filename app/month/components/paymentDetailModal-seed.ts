import type { Payment, PaymentFormData } from "@/lib/types"

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
