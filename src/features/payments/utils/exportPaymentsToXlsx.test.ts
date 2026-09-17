import { describe, expect, test } from "bun:test"
import type { Payment } from "@/lib/domain/entities/payment"
import {
  buildPaymentsExportFilename,
  buildPaymentsExportRows,
  PAYMENTS_EXPORT_HEADERS,
} from "./exportPaymentsToXlsx"

const payment: Payment = {
  _id: "payment-1",
  type: "income",
  date: "2026-09-14",
  tag: "Consulting",
  clientId: "client-1",
  concepts: [
    { name: "Workshop", amount: 120, quantity: 2 },
    { name: "Materials", amount: 15.5, quantity: 1 },
  ],
  vat: 21,
  surcharge: -15,
  discount: 10,
  deliveryNoteRef: "DN-123",
  netAmount: 202.89,
  vatAmount: 42.61,
  surchargeAmount: -30.43,
  total: 225.07,
  invoice: {
    type: "Invoice",
    id: "F26_001",
    generatedAt: new Date("2026-09-14T10:00:00.000Z"),
  },
  invoices: [
    {
      type: "Receipt",
      link: "https://example.com/receipt",
      generatedAt: new Date("2026-09-14T11:00:00.000Z"),
    },
  ],
  paymentMethod: "bank_transfer",
  createdAt: new Date("2026-09-14T09:00:00.000Z"),
  updatedAt: new Date("2026-09-15T09:00:00.000Z"),
}

describe("buildPaymentsExportFilename", () => {
  test("formats the year and zero-padded month", () => {
    expect(buildPaymentsExportFilename(2026, 9)).toBe("202609.xlsx")
    expect(buildPaymentsExportFilename(2026, 12)).toBe("202612.xlsx")
  })
})

describe("buildPaymentsExportRows", () => {
  test("exposes only the supported spreadsheet columns", () => {
    expect(PAYMENTS_EXPORT_HEADERS).toEqual([
      "Date",
      "Type",
      "Client",
      "Payment Method",
      "Concepts",
      "Concept Subtotal",
      "Discount",
      "Net Amount",
      "VAT Rate (%)",
      "VAT Amount",
      "Surcharge Rate (%)",
      "Surcharge Amount",
      "Total",
      "Invoices",
    ])
  })

  test("maps a payment to a complete spreadsheet row", () => {
    const [row] = buildPaymentsExportRows(
      [payment],
      new Map([["client-1", "Acme Ltd"]])
    )

    expect(row).toEqual({
      Date: "2026-09-14",
      Type: "Income",
      Client: "Acme Ltd",
      "Payment Method": "Bank transfer",
      Concepts: "Workshop (2 x 120.00 EUR) | Materials (1 x 15.50 EUR)",
      "Concept Subtotal": 255.5,
      Discount: 10,
      "Net Amount": 202.89,
      "VAT Rate (%)": 21,
      "VAT Amount": 42.61,
      "Surcharge Rate (%)": -15,
      "Surcharge Amount": -30.43,
      Total: 225.07,
      Invoices: "Invoice: F26_001 | Receipt: https://example.com/receipt",
    })
  })

  test("uses safe defaults for optional data", () => {
    const minimalPayment: Payment = {
      ...payment,
      _id: undefined,
      tag: undefined,
      clientId: undefined,
      surcharge: undefined,
      surchargeAmount: undefined,
      discount: undefined,
      deliveryNoteRef: undefined,
      invoice: undefined,
      invoices: undefined,
      paymentMethod: undefined,
    }

    const [row] = buildPaymentsExportRows([minimalPayment], new Map())

    expect(row.Client).toBe("")
    expect(row["Surcharge Rate (%)"]).toBe(0)
    expect(row["Surcharge Amount"]).toBe(0)
    expect(row.Discount).toBe(0)
    expect(row.Invoices).toBe("")
  })

  test("identifies a missing client", () => {
    const [row] = buildPaymentsExportRows([payment], new Map())

    expect(row.Client).toBe("Unknown client")
  })
})
