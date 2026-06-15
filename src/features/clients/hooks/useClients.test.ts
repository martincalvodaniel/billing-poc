"use client"

import { describe, expect, test } from "bun:test"
import { buildClientsKey, buildClientsUrl, isClientsKey } from "./useClients"

describe("buildClientsKey", () => {
  test("normalizes missing fields to defaults", () => {
    expect(buildClientsKey({})).toEqual(["/api/clients", "", 1, 10])
  })

  test("uses provided values when present", () => {
    expect(buildClientsKey({ search: "acme", page: 3, pageSize: 25 })).toEqual([
      "/api/clients",
      "acme",
      3,
      25,
    ])
  })

  test("is stable across calls with equal inputs", () => {
    const a = buildClientsKey({ search: "x", page: 2, pageSize: 10 })
    const b = buildClientsKey({ search: "x", page: 2, pageSize: 10 })
    expect(a).toEqual(b)
  })

  test("differs when any input changes", () => {
    expect(buildClientsKey({ search: "a" })).not.toEqual(
      buildClientsKey({ search: "b" })
    )
    expect(buildClientsKey({ page: 1 })).not.toEqual(
      buildClientsKey({ page: 2 })
    )
    expect(buildClientsKey({ pageSize: 10 })).not.toEqual(
      buildClientsKey({ pageSize: 20 })
    )
  })
})

describe("buildClientsUrl", () => {
  test("omits search when undefined", () => {
    expect(buildClientsUrl({})).toBe("/api/clients?page=1&pageSize=10")
  })

  test("omits search when empty string", () => {
    expect(buildClientsUrl({ search: "" })).toBe(
      "/api/clients?page=1&pageSize=10"
    )
  })

  test("includes search when non-empty", () => {
    expect(buildClientsUrl({ search: "acme" })).toBe(
      "/api/clients?search=acme&page=1&pageSize=10"
    )
  })

  test("encodes special characters in search", () => {
    expect(buildClientsUrl({ search: "a&b c" })).toBe(
      "/api/clients?search=a%26b+c&page=1&pageSize=10"
    )
  })

  test("uses provided page and pageSize", () => {
    expect(buildClientsUrl({ search: "x", page: 4, pageSize: 50 })).toBe(
      "/api/clients?search=x&page=4&pageSize=50"
    )
  })
})

describe("isClientsKey", () => {
  test("returns true for clients key tuple", () => {
    expect(isClientsKey(["/api/clients", "", 1, 10])).toBe(true)
  })

  test("returns true for any array starting with /api/clients", () => {
    expect(isClientsKey(["/api/clients"])).toBe(true)
  })

  test("returns false for arrays with a different first element", () => {
    expect(isClientsKey(["/api/payments", 2026, 4])).toBe(false)
  })

  test("returns false for non-array values", () => {
    expect(isClientsKey("/api/clients")).toBe(false)
    expect(isClientsKey(null)).toBe(false)
    expect(isClientsKey(undefined)).toBe(false)
    expect(isClientsKey({ 0: "/api/clients" })).toBe(false)
  })

  test("returns false for empty array", () => {
    expect(isClientsKey([])).toBe(false)
  })
})
