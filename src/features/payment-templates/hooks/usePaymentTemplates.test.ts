"use client"

import { describe, expect, test } from "bun:test"
import {
  buildPaymentTemplatesKey,
  buildPaymentTemplatesUrl,
  isPaymentTemplatesKey,
} from "./usePaymentTemplates"

describe("buildPaymentTemplatesKey", () => {
  test("returns a stable tuple", () => {
    expect(buildPaymentTemplatesKey()).toEqual(["/api/payment-templates"])
  })
})

describe("buildPaymentTemplatesUrl", () => {
  test("returns the list endpoint", () => {
    expect(buildPaymentTemplatesUrl()).toBe("/api/payment-templates")
  })
})

describe("isPaymentTemplatesKey", () => {
  test("accepts the list key shape", () => {
    expect(isPaymentTemplatesKey(["/api/payment-templates"])).toBe(true)
  })

  test("rejects unrelated keys", () => {
    expect(isPaymentTemplatesKey(["/api/payments"])).toBe(false)
    expect(isPaymentTemplatesKey([])).toBe(false)
    expect(isPaymentTemplatesKey(null)).toBe(false)
  })
})
