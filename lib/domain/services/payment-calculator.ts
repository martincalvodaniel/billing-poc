import type { PaymentConcept } from "../entities/payment"

export function calculateTotal(concepts: PaymentConcept[]): number {
  return concepts.reduce((sum, c) => sum + c.amount * (c.quantity || 1), 0)
}

export function calculateVatAmount(
  total: number,
  vatPercentage: number,
  surchargePercentage = 0
): number {
  const vat =
    (total * (vatPercentage / 100)) /
    (1 + vatPercentage / 100 + surchargePercentage / 100)
  return Number.parseFloat(vat.toFixed(2))
}

export function calculateSurchargeAmount(
  total: number,
  vatPercentage: number,
  surchargePercentage = 0
): number {
  if (surchargePercentage === 0) return 0
  const surcharge =
    (total * (surchargePercentage / 100)) /
    (1 + vatPercentage / 100 + surchargePercentage / 100)
  return Number.parseFloat(surcharge.toFixed(2))
}

export function calculateNetAmount(
  total: number,
  vatPercentage: number,
  surchargePercentage = 0
): number {
  return Number.parseFloat(
    (total / (1 + vatPercentage / 100 + surchargePercentage / 100)).toFixed(2)
  )
}

export function computePaymentFinancials(
  concepts: PaymentConcept[],
  vatPercentage: number,
  surchargePercentage = 0,
  discount = 0
) {
  // Discount reduces the concepts subtotal before VAT/surcharge extraction.
  const conceptsTotal = calculateTotal(concepts)
  const total = Number.parseFloat((conceptsTotal - discount).toFixed(2))
  const netAmount = calculateNetAmount(
    total,
    vatPercentage,
    surchargePercentage
  )
  const vatAmount = calculateVatAmount(
    total,
    vatPercentage,
    surchargePercentage
  )
  const surchargeAmount =
    surchargePercentage > 0
      ? calculateSurchargeAmount(total, vatPercentage, surchargePercentage)
      : undefined

  return { total, netAmount, vatAmount, surchargeAmount }
}
