import { describe, expect, test } from "bun:test"
import type { Payment } from "@/lib/domain/entities/payment"
import { computePaymentTotals } from "./monthlyPaymentsView-totals"

function payment(overrides: Partial<Payment>): Payment {
  return {
    type: "income",
    hidden: true,
    date: "2026-10-02",
    concepts: [{ name: "Service", amount: 121, quantity: 1 }],
    vat: 21,
    netAmount: 100,
    vatAmount: 21,
    total: 121,
    createdAt: new Date("2026-10-02T10:00:00Z"),
    updatedAt: new Date("2026-10-02T10:00:00Z"),
    ...overrides,
  }
}

describe("computePaymentTotals", () => {
  test("adds hidden income total to net and excludes it from VAT", () => {
    const totals = computePaymentTotals([payment({})])

    expect(totals.totalIncome).toBe(121)
    expect(totals.totalNetIncome).toBe(121)
    expect(totals.totalNet).toBe(121)
    expect(totals.totalVatIncome).toBe(0)
    expect(totals.totalVat).toBe(0)
  })

  test("uses regular net and VAT amounts for invoiced income", () => {
    const totals = computePaymentTotals([
      payment({
        hidden: false,
        invoices: [
          {
            type: "Invoice",
            id: "F26_001",
            generatedAt: new Date("2026-10-02T11:00:00Z"),
          },
        ],
      }),
    ])

    expect(totals.totalNetIncome).toBe(100)
    expect(totals.totalVatIncome).toBe(21)
  })
})
