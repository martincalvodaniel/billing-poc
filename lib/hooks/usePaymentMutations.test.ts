import { describe, expect, test } from "bun:test"
import { buildPaymentsRequest } from "./usePaymentMutations"

describe("buildPaymentsRequest", () => {
  test("builds POST request with JSON body and same-origin credentials", () => {
    const body = {
      type: "income" as const,
      date: "2025-04-01",
      concepts: [{ name: "Service", amount: 100, quantity: 1 }],
      vat: 21,
    }
    const { url, init } = buildPaymentsRequest("POST", body)

    expect(url).toBe("/api/payments")
    expect(init.method).toBe("POST")
    expect(init.credentials).toBe("same-origin")
    expect(init.headers).toEqual({ "Content-Type": "application/json" })
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("builds PUT request preserving body shape", () => {
    const body = { id: "abc123", date: "2025-04-02", vat: 10 }
    const { url, init } = buildPaymentsRequest("PUT", body)

    expect(url).toBe("/api/payments")
    expect(init.method).toBe("PUT")
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("builds DELETE request with id payload in body", () => {
    const body = { id: "abc123" }
    const { url, init } = buildPaymentsRequest("DELETE", body)

    expect(url).toBe("/api/payments")
    expect(init.method).toBe("DELETE")
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("PUT body with surcharge: 0 serializes raw zero (not stripped)", () => {
    const body = { id: "abc123", surcharge: 0 }
    const { init } = buildPaymentsRequest("PUT", body)

    expect(typeof init.body).toBe("string")
    expect(init.body as string).toContain('"surcharge":0')
  })
})
