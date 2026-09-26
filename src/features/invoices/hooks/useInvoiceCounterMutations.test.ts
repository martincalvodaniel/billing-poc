"use client"

import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { FetchError } from "@/lib/client/swr-fetcher"
import {
  buildInvoiceCounterTargetBody,
  buildReduceInvoiceCounterBody,
  previewInvoiceCounterFetcher,
  reduceInvoiceCounterFetcher,
} from "./useInvoiceCounterMutations"

const target = {
  series: "Invoice" as const,
  year: 2026,
  newLastNumber: 2,
}

describe("invoice counter request builders", () => {
  test("builds preview and reduction bodies", () => {
    expect(buildInvoiceCounterTargetBody(target)).toEqual(target)
    expect(
      buildReduceInvoiceCounterBody({
        ...target,
        expectedCurrentNumber: 3,
      })
    ).toEqual({ ...target, expectedCurrentNumber: 3 })
  })
})

describe("invoice counter mutation fetchers", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("previews with POST and reduces with PUT", async () => {
    const methods: string[] = []
    globalThis.fetch = (async (_input, init) => {
      methods.push(init?.method ?? "")
      return new Response(
        JSON.stringify({
          success: true,
          preview: {
            ...target,
            currentNumber: 3,
            invoices: [],
            affectedPaymentCount: 0,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    }) as typeof fetch

    await previewInvoiceCounterFetcher("/api/invoices/counters/preview", {
      arg: target,
    })
    await reduceInvoiceCounterFetcher("/api/invoices/counters", {
      arg: { ...target, expectedCurrentNumber: 3 },
    })

    expect(methods).toEqual(["POST", "PUT"])
  })

  test("maps API conflicts to FetchError", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: "Review the impact again" }), {
        status: 409,
        headers: { "content-type": "application/json" },
      })) as typeof fetch

    expect(
      previewInvoiceCounterFetcher("/api/invoices/counters/preview", {
        arg: target,
      })
    ).rejects.toEqual(
      expect.objectContaining<Partial<FetchError>>({
        name: "FetchError",
        status: 409,
        message: "Review the impact again",
      })
    )
  })
})
