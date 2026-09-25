import { describe, expect, test } from "bun:test"
import type { Payment } from "@/lib/domain/entities/payment"
import { getPaymentNavigation } from "./payment-navigation"

function makePayment(id?: string): Payment {
  return {
    _id: id,
    type: "income",
    date: "2026-09-25",
    concepts: [{ name: "Service", amount: 100, quantity: 1 }],
    vat: 21,
    netAmount: 82.64,
    vatAmount: 17.36,
    total: 100,
    createdAt: new Date("2026-09-25T10:00:00Z"),
    updatedAt: new Date("2026-09-25T10:00:00Z"),
  }
}

describe("getPaymentNavigation", () => {
  const displayedPayments = [
    makePayment("payment-3"),
    makePayment("payment-2"),
    makePayment("payment-1"),
  ]

  test("follows the order of the displayed payments", () => {
    expect(getPaymentNavigation(displayedPayments, "payment-2")).toEqual({
      currentPosition: 2,
      total: 3,
      previousPaymentId: "payment-3",
      nextPaymentId: "payment-1",
    })
  })

  test("disables navigation past the first and last displayed payments", () => {
    expect(
      getPaymentNavigation(displayedPayments, "payment-3")?.previousPaymentId
    ).toBeNull()
    expect(
      getPaymentNavigation(displayedPayments, "payment-1")?.nextPaymentId
    ).toBeNull()
  })

  test("ignores payments without an identifier", () => {
    const navigation = getPaymentNavigation(
      [makePayment("payment-2"), makePayment(), makePayment("payment-1")],
      "payment-1"
    )

    expect(navigation).toEqual({
      currentPosition: 2,
      total: 2,
      previousPaymentId: "payment-2",
      nextPaymentId: null,
    })
  })

  test("returns null when the payment is not displayed", () => {
    expect(getPaymentNavigation(displayedPayments, "payment-4")).toBeNull()
  })
})
