import type { PaymentConcept } from "../entities/payment"

export function calculateTotal(concepts: PaymentConcept[]): number {
  return concepts.reduce((sum, c) => sum + c.amount * (c.quantity || 1), 0)
}

export function calculateVatAmount(
  total: number,
  vatPercentage: number,
  _surchargePercentage = 0
): number {
  const net = calculateNetAmount(total, vatPercentage)
  const vat = total - net
  return Number.parseFloat(vat.toFixed(2))
}

export function calculateSurchargeAmount(
  total: number,
  vatPercentage: number,
  surchargePercentage = 0
): number {
  if (surchargePercentage === 0) return 0
  const net = calculateNetAmount(total, vatPercentage)
  const surcharge = net * (surchargePercentage / 100)
  return Number.parseFloat(surcharge.toFixed(2))
}

export function calculateNetAmount(
  total: number,
  vatPercentage: number,
  _surchargePercentage = 0
): number {
  return Number.parseFloat((total / (1 + vatPercentage / 100)).toFixed(2))
}

export function computePaymentFinancials(
  concepts: PaymentConcept[],
  vatPercentage: number,
  surchargePercentage = 0,
  discount = 0
) {
  // Discount reduces the concepts subtotal before VAT extraction.
  const conceptsTotal = calculateTotal(concepts)
  const taxableBase = Number.parseFloat((conceptsTotal - discount).toFixed(2))
  const netAmount = calculateNetAmount(taxableBase, vatPercentage)
  const vatAmount = calculateVatAmount(
    taxableBase,
    vatPercentage,
    surchargePercentage
  )
  const surchargeAmount =
    surchargePercentage !== 0
      ? calculateSurchargeAmount(taxableBase, vatPercentage, surchargePercentage)
      : undefined
  const total = Number.parseFloat(
    (taxableBase + (surchargeAmount ?? 0)).toFixed(2)
  )

  return { total, netAmount, vatAmount, surchargeAmount }
}
