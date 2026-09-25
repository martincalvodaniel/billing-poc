import { describe, expect, test } from "bun:test"
import type { Payment } from "../entities/payment"
import {
  collectGeneratedInvoices,
  countAffectedPayments,
  formatInvoiceNumber,
  getInvoicesRemovedByReduction,
  parseInvoiceId,
} from "./invoice-numbering"

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    _id: "507f1f77bcf86cd799439011",
    type: "income",
    date: "2026-03-12",
    concepts: [{ name: "Workshop", amount: 121, quantity: 1 }],
    vat: 21,
    netAmount: 100,
    vatAmount: 21,
    total: 121,
    createdAt: new Date("2026-03-12T10:00:00Z"),
    updatedAt: new Date("2026-03-12T10:00:00Z"),
    ...overrides,
  }
}

describe("invoice number formatting", () => {
  test("formats and parses every numbered series", () => {
    expect(formatInvoiceNumber("Invoice", 2026, 7)).toBe("F26_007")
    expect(formatInvoiceNumber("SimpleInvoice", 2026, 7)).toBe("FS26_007")
    expect(formatInvoiceNumber("RectificativeInvoice", 2026, 7)).toBe(
      "FR26_007"
    )
    expect(formatInvoiceNumber("RectificativeSimpleInvoice", 2026, 7)).toBe(
      "FSR26_007"
    )

    expect(parseInvoiceId("FSR26_042")).toEqual({
      type: "RectificativeSimpleInvoice",
      year: 2026,
      n: 42,
    })
  })

  test("rejects malformed and zero invoice ids", () => {
    expect(parseInvoiceId("F26_000")).toBeNull()
    expect(parseInvoiceId("receipt.pdf")).toBeNull()
  })
})

describe("collectGeneratedInvoices", () => {
  test("collects generated invoices and ignores link-only entries", () => {
    const records = collectGeneratedInvoices([
      payment({
        invoices: [
          {
            type: "Invoice",
            id: "F26_003",
            generatedAt: new Date("2026-03-12T11:00:00Z"),
          },
          {
            type: "Receipt",
            link: "https://example.com/receipt",
            generatedAt: new Date("2026-03-12T12:00:00Z"),
          },
        ],
      }),
    ])

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      id: "F26_003",
      series: "Invoice",
      year: 2026,
      number: 3,
      paymentDescription: "Workshop",
    })
  })

  test("sorts newest years and highest numbers first within a series", () => {
    const records = collectGeneratedInvoices([
      payment({
        invoices: [
          {
            type: "Invoice",
            id: "F25_009",
            generatedAt: new Date("2025-01-01T00:00:00Z"),
          },
          {
            type: "Invoice",
            id: "F26_002",
            generatedAt: new Date("2026-01-01T00:00:00Z"),
          },
          {
            type: "Invoice",
            id: "F26_010",
            generatedAt: new Date("2026-02-01T00:00:00Z"),
          },
        ],
      }),
    ])

    expect(records.map((record) => record.id)).toEqual([
      "F26_010",
      "F26_002",
      "F25_009",
    ])
  })
})

describe("invoice reduction impact", () => {
  test("returns only invoices above the requested number", () => {
    const records = collectGeneratedInvoices([
      payment({
        invoices: [
          {
            type: "Invoice",
            id: "F26_001",
            generatedAt: new Date(),
          },
          {
            type: "Invoice",
            id: "F26_003",
            generatedAt: new Date(),
          },
          {
            type: "SimpleInvoice",
            id: "FS26_004",
            generatedAt: new Date(),
          },
        ],
      }),
    ])

    const removed = getInvoicesRemovedByReduction(records, "Invoice", 2026, 1)
    expect(removed.map((record) => record.id)).toEqual(["F26_003"])
    expect(countAffectedPayments(removed)).toBe(1)
  })
})
