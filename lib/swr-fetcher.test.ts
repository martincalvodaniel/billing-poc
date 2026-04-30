import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { FetchError, fetcher, shouldRetryOnError } from "./swr-fetcher"

const originalFetch = globalThis.fetch

function mockFetch(response: Response) {
  globalThis.fetch = mock(async () => response) as unknown as typeof fetch
}

describe("fetcher", () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("returns parsed JSON on 200 response", async () => {
    const payload = { hello: "world", n: 42 }
    mockFetch(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )

    const result = await fetcher<typeof payload>("/api/example")
    expect(result).toEqual(payload)
  })

  test("throws FetchError with correct status and info on 500 with JSON body", async () => {
    const errorBody = { error: "boom", code: "X" }
    mockFetch(
      new Response(JSON.stringify(errorBody), {
        status: 500,
        headers: { "content-type": "application/json" },
      })
    )

    let caught: unknown
    try {
      await fetcher("/api/broken")
    } catch (e) {
      caught = e
    }

    expect(caught).toBeInstanceOf(FetchError)
    const err = caught as FetchError
    expect(err.status).toBe(500)
    expect(err.info).toEqual(errorBody)
  })

  test("throws FetchError with status 401 on unauthorized", async () => {
    mockFetch(
      new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    )

    let caught: unknown
    try {
      await fetcher("/api/secure")
    } catch (e) {
      caught = e
    }

    expect(caught).toBeInstanceOf(FetchError)
    expect((caught as FetchError).status).toBe(401)
  })
})

describe("shouldRetryOnError", () => {
  test("returns false for 401, 403, 404 FetchErrors", () => {
    expect(shouldRetryOnError(new FetchError("u", 401, null))).toBe(false)
    expect(shouldRetryOnError(new FetchError("f", 403, null))).toBe(false)
    expect(shouldRetryOnError(new FetchError("nf", 404, null))).toBe(false)
  })

  test("returns true for other FetchError statuses", () => {
    expect(shouldRetryOnError(new FetchError("server", 500, null))).toBe(true)
    expect(shouldRetryOnError(new FetchError("bad", 400, null))).toBe(true)
  })

  test("returns true for non-FetchError errors", () => {
    expect(shouldRetryOnError(new Error("network"))).toBe(true)
    expect(shouldRetryOnError("string error")).toBe(true)
    expect(shouldRetryOnError(null)).toBe(true)
  })
})
