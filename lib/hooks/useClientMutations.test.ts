import { describe, expect, test } from "bun:test"
import {
  buildJsonRequestInit,
  CLIENTS_ENDPOINT,
  isClientsKey,
} from "./useClientMutations"

describe("CLIENTS_ENDPOINT", () => {
  test("targets /api/clients", () => {
    expect(CLIENTS_ENDPOINT).toBe("/api/clients")
  })
})

describe("isClientsKey", () => {
  test("returns true for an array key starting with /api/clients", () => {
    expect(isClientsKey(["/api/clients", "", 1, 10])).toBe(true)
  })

  test("returns true for the bare endpoint string array", () => {
    expect(isClientsKey(["/api/clients"])).toBe(true)
  })

  test("returns false for a different resource key", () => {
    expect(isClientsKey(["/api/payments", 2026, 4])).toBe(false)
  })

  test("returns false for the endpoint string (not wrapped in array)", () => {
    expect(isClientsKey("/api/clients")).toBe(false)
  })

  test("returns false for non-array values", () => {
    expect(isClientsKey(undefined)).toBe(false)
    expect(isClientsKey(null)).toBe(false)
    expect(isClientsKey(42)).toBe(false)
    expect(isClientsKey({ url: "/api/clients" })).toBe(false)
  })
})

describe("buildJsonRequestInit", () => {
  test("encodes POST body as JSON with content-type header", () => {
    const init = buildJsonRequestInit("POST", {
      clientType: "individual",
      name: "Jane",
      taxId: "12345678A",
      address: "Calle 1",
    })

    expect(init.method).toBe("POST")
    expect(init.headers).toEqual({ "Content-Type": "application/json" })
    expect(init.body).toBe(
      JSON.stringify({
        clientType: "individual",
        name: "Jane",
        taxId: "12345678A",
        address: "Calle 1",
      })
    )
  })

  test("encodes PUT body for update with id", () => {
    const init = buildJsonRequestInit("PUT", { id: "abc", name: "Jane" })
    expect(init.method).toBe("PUT")
    expect(init.body).toBe(JSON.stringify({ id: "abc", name: "Jane" }))
  })

  test("encodes DELETE body with id", () => {
    const init = buildJsonRequestInit("DELETE", { id: "abc" })
    expect(init.method).toBe("DELETE")
    expect(init.body).toBe(JSON.stringify({ id: "abc" }))
  })
})
