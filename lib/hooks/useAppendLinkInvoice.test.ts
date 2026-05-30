import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { FetchError } from "@/lib/swr-fetcher"
import {
  appendLinkInvoiceFetcher,
  buildAppendLinkInvoiceBody,
  buildAppendLinkInvoiceUrl,
} from "./useAppendLinkInvoice"

describe("buildAppendLinkInvoiceUrl", () => {
  test("formats the per-payment endpoint", () => {
    expect(buildAppendLinkInvoiceUrl("abc123")).toBe(
      "/api/payments/abc123/invoices/link"
    )
  })

  test("URI-encodes the paymentId segment", () => {
    expect(buildAppendLinkInvoiceUrl("a/b c")).toBe(
      "/api/payments/a%2Fb%20c/invoices/link"
    )
  })
})

describe("buildAppendLinkInvoiceBody", () => {
  test("wraps an Invoice link", () => {
    expect(
      buildAppendLinkInvoiceBody({
        type: "Invoice",
        link: "https://example.com/bill.pdf",
      })
    ).toEqual({ type: "Invoice", link: "https://example.com/bill.pdf" })
  })

  test("wraps a Receipt link", () => {
    expect(
      buildAppendLinkInvoiceBody({
        type: "Receipt",
        link: "https://example.com/receipt.pdf",
      })
    ).toEqual({ type: "Receipt", link: "https://example.com/receipt.pdf" })
  })

  test("JSON.stringify round-trips to a stable string", () => {
    expect(
      JSON.stringify(
        buildAppendLinkInvoiceBody({
          type: "Invoice",
          link: "https://x.example/y.pdf",
        })
      )
    ).toBe('{"type":"Invoice","link":"https://x.example/y.pdf"}')
  })
})

describe("appendLinkInvoiceFetcher", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("POSTs JSON to the per-payment endpoint", async () => {
    let capturedUrl: string | null = null
    let capturedInit: RequestInit | null = null
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      capturedUrl = typeof input === "string" ? input : String(input)
      capturedInit = init ?? null
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }) as typeof fetch

    const result = await appendLinkInvoiceFetcher(
      "/api/payments/p1/invoices/link",
      {
        arg: { type: "Receipt", link: "https://x/y" },
      }
    )

    expect(capturedUrl).toBe("/api/payments/p1/invoices/link")
    expect(capturedInit?.method).toBe("POST")
    expect(
      (capturedInit?.headers as Record<string, string> | undefined)?.[
        "Content-Type"
      ]
    ).toBe("application/json")
    expect(capturedInit?.body).toBe('{"type":"Receipt","link":"https://x/y"}')
    expect(result).toEqual({ ok: true })
  })

  test("maps non-ok JSON responses to FetchError with status + message", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      })) as typeof fetch

    let thrown: unknown
    try {
      await appendLinkInvoiceFetcher("/api/payments/missing/invoices/link", {
        arg: { type: "Invoice", link: "https://x/y" },
      })
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeInstanceOf(FetchError)
    const fe = thrown as FetchError
    expect(fe.status).toBe(404)
    expect(fe.message).toBe("Payment not found")
  })

  test("falls back to a default error message when body has no error field", async () => {
    globalThis.fetch = (async () =>
      new Response("server exploded", {
        status: 500,
        headers: { "content-type": "text/plain" },
      })) as typeof fetch

    let thrown: unknown
    try {
      await appendLinkInvoiceFetcher("/api/payments/p/invoices/link", {
        arg: { type: "Invoice", link: "https://x/y" },
      })
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeInstanceOf(FetchError)
    const fe = thrown as FetchError
    expect(fe.status).toBe(500)
    expect(fe.message).toBe("Failed to append link invoice")
  })
})
