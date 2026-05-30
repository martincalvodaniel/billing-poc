import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { FetchError } from "@/lib/swr-fetcher"
import {
  buildRemoveLinkInvoiceBody,
  buildRemoveLinkInvoiceUrl,
  removeLinkInvoiceFetcher,
} from "./useRemoveLinkInvoice"

describe("buildRemoveLinkInvoiceUrl", () => {
  test("formats the per-payment endpoint", () => {
    expect(buildRemoveLinkInvoiceUrl("abc123")).toBe(
      "/api/payments/abc123/invoices/link"
    )
  })

  test("URI-encodes the paymentId segment", () => {
    expect(buildRemoveLinkInvoiceUrl("a/b c")).toBe(
      "/api/payments/a%2Fb%20c/invoices/link"
    )
  })
})

describe("buildRemoveLinkInvoiceBody", () => {
  test("wraps a link", () => {
    expect(
      buildRemoveLinkInvoiceBody({
        link: "https://example.com/bill.pdf",
      })
    ).toEqual({ link: "https://example.com/bill.pdf" })
  })

  test("JSON.stringify round-trips to a stable string", () => {
    expect(
      JSON.stringify(
        buildRemoveLinkInvoiceBody({ link: "https://x.example/y.pdf" })
      )
    ).toBe('{"link":"https://x.example/y.pdf"}')
  })
})

describe("removeLinkInvoiceFetcher", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("DELETEs JSON to the per-payment endpoint", async () => {
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

    const result = await removeLinkInvoiceFetcher(
      "/api/payments/p1/invoices/link",
      { arg: { link: "https://x/y" } }
    )

    expect(capturedUrl).toBe("/api/payments/p1/invoices/link")
    expect(capturedInit?.method).toBe("DELETE")
    expect(
      (capturedInit?.headers as Record<string, string> | undefined)?.[
        "Content-Type"
      ]
    ).toBe("application/json")
    expect(capturedInit?.body).toBe('{"link":"https://x/y"}')
    expect(result).toEqual({ ok: true })
  })

  test("maps non-ok JSON responses to FetchError with status + message", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: "Link entry not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      })) as typeof fetch

    let thrown: unknown
    try {
      await removeLinkInvoiceFetcher("/api/payments/missing/invoices/link", {
        arg: { link: "https://x/y" },
      })
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeInstanceOf(FetchError)
    const fe = thrown as FetchError
    expect(fe.status).toBe(404)
    expect(fe.message).toBe("Link entry not found")
  })

  test("falls back to a default error message when body has no error field", async () => {
    globalThis.fetch = (async () =>
      new Response("server exploded", {
        status: 500,
        headers: { "content-type": "text/plain" },
      })) as typeof fetch

    let thrown: unknown
    try {
      await removeLinkInvoiceFetcher("/api/payments/p/invoices/link", {
        arg: { link: "https://x/y" },
      })
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeInstanceOf(FetchError)
    const fe = thrown as FetchError
    expect(fe.status).toBe(500)
    expect(fe.message).toBe("Failed to remove link invoice")
  })
})
