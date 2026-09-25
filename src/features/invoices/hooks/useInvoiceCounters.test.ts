"use client"

import { describe, expect, test } from "bun:test"
import {
  buildInvoiceCountersKey,
  buildInvoiceCountersUrl,
  isInvoiceCountersKey,
} from "./useInvoiceCounters"

describe("buildInvoiceCountersKey", () => {
  test("returns a stable tuple", () => {
    expect(buildInvoiceCountersKey()).toEqual(["/api/invoices/counters"])
    expect(buildInvoiceCountersKey()).toEqual(buildInvoiceCountersKey())
  })
})

describe("buildInvoiceCountersUrl", () => {
  test("returns the invoice counters endpoint", () => {
    expect(buildInvoiceCountersUrl()).toBe("/api/invoices/counters")
  })
})

describe("isInvoiceCountersKey", () => {
  test("detects the invoice counters key", () => {
    expect(isInvoiceCountersKey(["/api/invoices/counters"])).toBe(true)
  })

  test("rejects unrelated values", () => {
    expect(isInvoiceCountersKey(["/api/invoices"])).toBe(false)
    expect(isInvoiceCountersKey(["/api/invoices/counters", "extra"])).toBe(
      false
    )
    expect(isInvoiceCountersKey("/api/invoices/counters")).toBe(false)
  })
})
