import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { FetchError } from "@/lib/swr-fetcher"
import {
  buildSetProviderBillLinkBody,
  buildSetProviderBillLinkUrl,
  setProviderBillLinkFetcher,
} from "./useSetProviderBillLink"

describe("buildSetProviderBillLinkUrl", () => {
  test("formats the per-payment endpoint", () => {
    expect(buildSetProviderBillLinkUrl("abc123")).toBe(
      "/api/payments/abc123/provider-bill"
    )
  })

  test("URI-encodes the paymentId segment", () => {
    expect(buildSetProviderBillLinkUrl("a/b c")).toBe(
      "/api/payments/a%2Fb%20c/provider-bill"
    )
  })
})

describe("buildSetProviderBillLinkBody", () => {
  test("wraps a url string", () => {
    const body = buildSetProviderBillLinkBody({
      url: "https://example.com/bill.pdf",
    })
    expect(body).toEqual({ url: "https://example.com/bill.pdf" })
  })

  test("passes through null to signal clearing", () => {
    const body = buildSetProviderBillLinkBody({ url: null })
    expect(body).toEqual({ url: null })
  })

  test("JSON.stringify round-trips to a stable string", () => {
    expect(
      JSON.stringify(
        buildSetProviderBillLinkBody({ url: "https://x.example/y.pdf" })
      )
    ).toBe('{"url":"https://x.example/y.pdf"}')
    expect(JSON.stringify(buildSetProviderBillLinkBody({ url: null }))).toBe(
      '{"url":null}'
    )
  })
})

describe("setProviderBillLinkFetcher", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("PUTs JSON to the per-payment endpoint", async () => {
    let capturedUrl: string | null = null
    let capturedInit: RequestInit | null = null
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      capturedUrl = typeof input === "string" ? input : String(input)
      capturedInit = init ?? null
      return new Response(
        JSON.stringify({ success: true, providerBillLink: "https://x/y" }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    }) as typeof fetch

    const result = await setProviderBillLinkFetcher("/key", {
      arg: { paymentId: "p1", url: "https://x/y" },
    })

    expect(capturedUrl).toBe("/api/payments/p1/provider-bill")
    expect(capturedInit?.method).toBe("PUT")
    expect(
      (capturedInit?.headers as Record<string, string> | undefined)?.[
        "Content-Type"
      ]
    ).toBe("application/json")
    expect(capturedInit?.body).toBe('{"url":"https://x/y"}')
    expect(result).toEqual({ success: true, providerBillLink: "https://x/y" })
  })

  test("maps non-ok JSON responses to FetchError with status + message", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      })) as typeof fetch

    let thrown: unknown
    try {
      await setProviderBillLinkFetcher("/key", {
        arg: { paymentId: "missing", url: null },
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
      await setProviderBillLinkFetcher("/key", {
        arg: { paymentId: "p", url: null },
      })
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeInstanceOf(FetchError)
    const fe = thrown as FetchError
    expect(fe.status).toBe(500)
    expect(fe.message).toBe("Failed to update provider bill link")
  })
})
