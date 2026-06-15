"use client"

import { describe, expect, test } from "bun:test"
import {
  buildGenerateInvoiceBody,
  buildOpenInvoiceUrl,
  type GenerateInvoiceResult,
} from "./useInvoiceMutations"

describe("buildGenerateInvoiceBody", () => {
  test("returns the exact JSON body shape expected by /api/invoices/generate", () => {
    const body = buildGenerateInvoiceBody({
      paymentId: "abc123",
      type: "Invoice",
    })
    expect(body).toEqual({ paymentId: "abc123", type: "Invoice" })
  })

  test("preserves the chosen invoice type", () => {
    const body = buildGenerateInvoiceBody({
      paymentId: "p1",
      type: "RectificativeSimpleInvoice",
    })
    expect(body.type).toBe("RectificativeSimpleInvoice")
  })

  test("JSON.stringify round-trips to a stable string", () => {
    const body = buildGenerateInvoiceBody({
      paymentId: "p2",
      type: "SimpleInvoice",
    })
    expect(JSON.stringify(body)).toBe(
      '{"paymentId":"p2","type":"SimpleInvoice"}'
    )
  })

  test("omits persist when not provided", () => {
    const body = buildGenerateInvoiceBody({
      paymentId: "p3",
      type: "Invoice",
    })
    expect("persist" in body).toBe(false)
    expect(JSON.stringify(body)).toBe('{"paymentId":"p3","type":"Invoice"}')
  })

  test("forwards persist: true", () => {
    const body = buildGenerateInvoiceBody({
      paymentId: "p4",
      type: "Invoice",
      persist: true,
    })
    expect(body.persist).toBe(true)
  })

  test("forwards persist: false", () => {
    const body = buildGenerateInvoiceBody({
      paymentId: "p5",
      type: "Invoice",
      persist: false,
    })
    expect(body.persist).toBe(false)
  })
})

describe("buildOpenInvoiceUrl", () => {
  test("formats the per-invoice download URL with a single invoice-id segment", () => {
    const url = buildOpenInvoiceUrl("abc123", "F26_001")
    expect(url).toBe("/api/invoices/abc123/F26_001")
  })

  test("URI-encodes the paymentId segment", () => {
    const url = buildOpenInvoiceUrl("a/b c", "S26_042")
    expect(url).toBe("/api/invoices/a%2Fb%20c/S26_042")
  })

  test("URI-encodes the invoiceId segment", () => {
    const url = buildOpenInvoiceUrl("p", "F26/001")
    expect(url).toBe("/api/invoices/p/F26%2F001")
  })
})

describe("GenerateInvoiceResult", () => {
  test("parses the response shape returned by /api/invoices/generate", () => {
    const sample: GenerateInvoiceResult = {
      success: true,
      invoice: {
        type: "Invoice",
        id: "F26_003",
        generatedAt: new Date("2026-05-30T12:00:00Z"),
      },
      invoices: [
        {
          type: "Invoice",
          id: "F26_003",
          generatedAt: new Date("2026-05-30T12:00:00Z"),
        },
      ],
      id: "F26_003",
      type: "Invoice",
      downloadUrl: "/api/invoices/pay/F26_003",
    }
    expect(sample.invoices).toHaveLength(1)
    expect(sample.id).toBe("F26_003")
    expect(sample.type).toBe("Invoice")
    expect(sample.downloadUrl).toBe("/api/invoices/pay/F26_003")
  })
})
