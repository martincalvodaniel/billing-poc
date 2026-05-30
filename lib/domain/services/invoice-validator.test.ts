import { describe, expect, test } from "bun:test"
import type { InvoiceMetadata, InvoiceSeries } from "../entities/payment"
import {
  assertCanGenerateInvoice,
  generateInvoiceSchema,
  type InvoiceCandidatePayment,
} from "./invoice-validator"

function invoice(series: InvoiceSeries, number = 1): InvoiceMetadata {
  return {
    series,
    number,
    formattedNumber: `${series}-${number}`,
    generatedAt: new Date("2026-01-01T00:00:00Z"),
    blobUrl: "https://blob.example/x.pdf",
    blobPathname: "x.pdf",
  }
}

const incomeWithClient: InvoiceCandidatePayment = {
  type: "income",
  clientId: "507f1f77bcf86cd799439011",
}

const incomeNoClient: InvoiceCandidatePayment = { type: "income" }

describe("generateInvoiceSchema", () => {
  test("accepts a valid body", () => {
    const parsed = generateInvoiceSchema.parse({
      paymentId: "507f1f77bcf86cd799439011",
      series: "Invoice",
    })
    expect(parsed.paymentId).toBe("507f1f77bcf86cd799439011")
    expect(parsed.series).toBe("Invoice")
  })

  test("rejects an invalid ObjectId", () => {
    expect(() =>
      generateInvoiceSchema.parse({
        paymentId: "not-an-objectid",
        series: "Invoice",
      })
    ).toThrow()
  })

  test("rejects an unknown series", () => {
    expect(() =>
      generateInvoiceSchema.parse({
        paymentId: "507f1f77bcf86cd799439011",
        series: "NotARealSeries",
      })
    ).toThrow()
  })
})

describe("assertCanGenerateInvoice — rejection branches", () => {
  test("rejects outcome payments", () => {
    const result = assertCanGenerateInvoice(
      { type: "outcome", clientId: incomeWithClient.clientId },
      "Invoice"
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/income/i)
  })

  test("rejects a duplicate base Invoice", () => {
    const result = assertCanGenerateInvoice(
      { ...incomeWithClient, invoices: [invoice("Invoice")] },
      "Invoice"
    )
    expect(result.ok).toBe(false)
  })

  test("rejects a duplicate base SimpleInvoice", () => {
    const result = assertCanGenerateInvoice(
      { ...incomeWithClient, invoices: [invoice("SimpleInvoice")] },
      "SimpleInvoice"
    )
    expect(result.ok).toBe(false)
  })

  test("rejects a RectificativeInvoice when the base Invoice is missing", () => {
    const result = assertCanGenerateInvoice(
      incomeWithClient,
      "RectificativeInvoice"
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/Invoice/)
  })

  test("rejects a RectificativeSimpleInvoice when the base SimpleInvoice is missing", () => {
    const result = assertCanGenerateInvoice(
      incomeWithClient,
      "RectificativeSimpleInvoice"
    )
    expect(result.ok).toBe(false)
  })

  test("rejects a regular Invoice when clientId is missing", () => {
    const result = assertCanGenerateInvoice(incomeNoClient, "Invoice")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/client/i)
  })

  test("rejects a RectificativeInvoice when clientId is missing (even if base exists)", () => {
    const result = assertCanGenerateInvoice(
      { type: "income", invoices: [invoice("Invoice")] },
      "RectificativeInvoice"
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/client/i)
  })

  test("considers legacy `invoice` field when checking for duplicates", () => {
    const result = assertCanGenerateInvoice(
      { ...incomeWithClient, invoice: invoice("Invoice") },
      "Invoice"
    )
    expect(result.ok).toBe(false)
  })
})

describe("assertCanGenerateInvoice — happy paths", () => {
  test("allows a fresh Invoice when clientId is present", () => {
    expect(assertCanGenerateInvoice(incomeWithClient, "Invoice")).toEqual({
      ok: true,
    })
  })

  test("allows a fresh SimpleInvoice without a clientId", () => {
    expect(assertCanGenerateInvoice(incomeNoClient, "SimpleInvoice")).toEqual({
      ok: true,
    })
  })

  test("allows a RectificativeInvoice when the base Invoice exists and client is present", () => {
    expect(
      assertCanGenerateInvoice(
        { ...incomeWithClient, invoices: [invoice("Invoice")] },
        "RectificativeInvoice"
      )
    ).toEqual({ ok: true })
  })

  test("allows a RectificativeSimpleInvoice when the base SimpleInvoice exists (no client needed)", () => {
    expect(
      assertCanGenerateInvoice(
        { type: "income", invoices: [invoice("SimpleInvoice")] },
        "RectificativeSimpleInvoice"
      )
    ).toEqual({ ok: true })
  })

  test("allows a RectificativeInvoice when the base lives in the legacy `invoice` field", () => {
    expect(
      assertCanGenerateInvoice(
        { ...incomeWithClient, invoice: invoice("Invoice") },
        "RectificativeInvoice"
      )
    ).toEqual({ ok: true })
  })
})
