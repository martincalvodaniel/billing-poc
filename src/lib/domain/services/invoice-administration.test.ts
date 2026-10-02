import { describe, expect, mock, test } from "bun:test"
import type { InvoiceCounter } from "../entities/invoice"
import type { Payment } from "../entities/payment"
import {
  getInvoiceOverview,
  previewInvoiceCounterReduction,
  reduceInvoiceCounter,
} from "./invoice-administration"

const counter: InvoiceCounter = {
  series: "Invoice",
  year: 2026,
  lastNumber: 3,
  updatedAt: new Date("2026-03-12T00:00:00Z"),
}

const invoicePayment: Payment = {
  hidden: false,
  _id: "507f1f77bcf86cd799439011",
  type: "income",
  date: "2026-03-12",
  concepts: [{ name: "Workshop", amount: 121, quantity: 1 }],
  vat: 21,
  netAmount: 100,
  vatAmount: 21,
  total: 121,
  invoices: [
    {
      type: "Invoice",
      id: "F26_003",
      generatedAt: new Date("2026-03-12T11:00:00Z"),
    },
  ],
  createdAt: new Date("2026-03-12T10:00:00Z"),
  updatedAt: new Date("2026-03-12T10:00:00Z"),
}

function stores(currentNumber = 3) {
  const setCurrentNumber = mock(async () => true)
  const removeGeneratedInvoices = mock(async () => 1)
  return {
    counters: {
      findAll: async () => [counter],
      getCurrentNumber: async () => currentNumber,
      setCurrentNumber,
    },
    payments: {
      findAllWithGeneratedInvoices: async () => [invoicePayment],
      removeGeneratedInvoices,
    },
    setCurrentNumber,
    removeGeneratedInvoices,
  }
}

describe("getInvoiceOverview", () => {
  test("returns counters and their generated invoice records", async () => {
    const { counters, payments } = stores()
    const overview = await getInvoiceOverview(counters, payments)
    expect(overview.counters).toEqual([counter])
    expect(overview.invoices.map((invoice) => invoice.id)).toEqual(["F26_003"])
  })
})

describe("previewInvoiceCounterReduction", () => {
  test("shows deleted invoices and affected payment count", async () => {
    const { counters, payments } = stores()
    const result = await previewInvoiceCounterReduction(counters, payments, {
      series: "Invoice",
      year: 2026,
      newLastNumber: 2,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.preview.invoices.map((invoice) => invoice.id)).toEqual([
      "F26_003",
    ])
    expect(result.preview.affectedPaymentCount).toBe(1)
  })

  test("rejects values that do not reduce the counter", async () => {
    const { counters, payments } = stores()
    const result = await previewInvoiceCounterReduction(counters, payments, {
      series: "Invoice",
      year: 2026,
      newLastNumber: 3,
    })
    expect(result).toMatchObject({ ok: false, reason: "not-a-reduction" })
  })
})

describe("reduceInvoiceCounter", () => {
  test("removes invoice metadata before reducing the counter", async () => {
    const calls: string[] = []
    const { counters, payments } = stores()
    payments.removeGeneratedInvoices = mock(async () => {
      calls.push("payments")
      return 1
    })
    counters.setCurrentNumber = mock(async () => {
      calls.push("counter")
      return true
    })

    const result = await reduceInvoiceCounter(counters, payments, {
      series: "Invoice",
      year: 2026,
      newLastNumber: 2,
      expectedCurrentNumber: 3,
    })

    expect(result.ok).toBe(true)
    expect(calls).toEqual(["payments", "counter"])
  })

  test("rejects a stale preview without mutating payments", async () => {
    const { counters, payments, removeGeneratedInvoices, setCurrentNumber } =
      stores(4)
    const result = await reduceInvoiceCounter(counters, payments, {
      series: "Invoice",
      year: 2026,
      newLastNumber: 2,
      expectedCurrentNumber: 3,
    })

    expect(result).toMatchObject({ ok: false, reason: "stale-preview" })
    expect(removeGeneratedInvoices).not.toHaveBeenCalled()
    expect(setCurrentNumber).not.toHaveBeenCalled()
  })

  test("does not reduce the counter when affected payments changed", async () => {
    const { counters, payments, setCurrentNumber } = stores()
    payments.removeGeneratedInvoices = mock(async () => 0)
    const result = await reduceInvoiceCounter(counters, payments, {
      series: "Invoice",
      year: 2026,
      newLastNumber: 2,
      expectedCurrentNumber: 3,
    })

    expect(result).toMatchObject({ ok: false, reason: "payments-changed" })
    expect(setCurrentNumber).not.toHaveBeenCalled()
  })
})
