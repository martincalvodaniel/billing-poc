import type { Payment } from "@/lib/domain/entities/payment"

export interface PaymentTotals {
  totalIncome: number
  totalOutcome: number
  totalVat: number
  totalVatIncome: number
  totalVatOutcome: number
  totalNet: number
  totalNetIncome: number
  totalNetOutcome: number
  incomeCount: number
  outcomeCount: number
  incomeByTag: Record<string, number>
  outcomeByTag: Record<string, number>
}

/**
 * Computes totals, counts, and per-tag breakdowns for a list of payments in
 * a single pass (js-combine-iterations).
 */
export function computePaymentTotals(payments: Payment[]): PaymentTotals {
  let income = 0
  let outcome = 0
  let vatIncome = 0
  let vatOutcome = 0
  let netIncome = 0
  let netOutcome = 0
  let incCount = 0
  let outCount = 0
  const incByTag: Record<string, number> = {}
  const outByTag: Record<string, number> = {}
  for (const p of payments) {
    const tag = p.tag || "Untagged"
    if (p.type === "income") {
      income += p.total
      vatIncome += p.vatAmount
      netIncome += p.netAmount
      incByTag[tag] = (incByTag[tag] || 0) + p.total
      incCount++
    } else {
      outcome += p.total
      vatOutcome += p.vatAmount
      netOutcome += p.netAmount
      outByTag[tag] = (outByTag[tag] || 0) + p.total
      outCount++
    }
  }
  return {
    totalIncome: income,
    totalOutcome: outcome,
    totalVat: vatIncome - vatOutcome,
    totalVatIncome: vatIncome,
    totalVatOutcome: vatOutcome,
    totalNet: netIncome - netOutcome,
    totalNetIncome: netIncome,
    totalNetOutcome: netOutcome,
    incomeCount: incCount,
    outcomeCount: outCount,
    incomeByTag: incByTag,
    outcomeByTag: outByTag,
  }
}
