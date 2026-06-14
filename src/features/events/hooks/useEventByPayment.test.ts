"use client"

import { describe, expect, test } from "bun:test"
import {
  buildEventByPaymentKey,
  buildEventByPaymentUrl,
} from "./useEventByPayment"

describe("buildEventByPaymentKey", () => {
  test("builds stable tuple key", () => {
    expect(buildEventByPaymentKey("pay1")).toEqual([
      "/api/events/payment",
      "pay1",
    ])
  })
})

describe("buildEventByPaymentUrl", () => {
  test("builds API URL for payment id", () => {
    expect(buildEventByPaymentUrl("pay1")).toBe("/api/events/payment/pay1")
  })

  test("encodes reserved chars in payment id", () => {
    expect(buildEventByPaymentUrl("a/b c")).toBe(
      "/api/events/payment/a%2Fb%20c"
    )
  })
})
