import { describe, expect, it } from "bun:test"
import type { Payment } from "@/lib/domain/entities/payment"
import { buildDuplicateSeed } from "./paymentDetailModal-seed"

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    type: "income",
    date: "2026-05-15",
    tag: "consulting",
    concepts: [
      { name: "Hours", amount: 100, quantity: 2 },
      { name: "Travel", amount: 50, quantity: 1 },
    ],
    vat: 21,
    surcharge: 5.2,
    discount: 10,
    deliveryNoteRef: "DN-001",
    paymentMethod: "bank_transfer",
    netAmount: 250,
    vatAmount: 52.5,
    surchargeAmount: 13,
    total: 250,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe("buildDuplicateSeed", () => {
  it("copies type, date, tag, vat and surcharge as strings", () => {
    const seed = buildDuplicateSeed(makePayment())
    expect(seed.type).toBe("income")
    expect(seed.date).toBe("2026-05-15")
    expect(seed.tag).toBe("consulting")
    expect(seed.vat).toBe("21")
    expect(seed.surcharge).toBe("5.2")
  })

  it("deep-clones concepts (mutating the seed does not affect the source)", () => {
    const source = makePayment()
    const seed = buildDuplicateSeed(source)
    expect(seed.concepts).toEqual(source.concepts)
    expect(seed.concepts).not.toBe(source.concepts)
    seed.concepts[0].amount = 9999
    expect(source.concepts[0].amount).toBe(100)
  })

  it("blanks clientId, discount, paymentMethod and deliveryNoteRef", () => {
    const seed = buildDuplicateSeed(makePayment())
    expect(seed.clientId).toBeUndefined()
    expect(seed.discount).toBe("")
    expect(seed.paymentMethod).toBe("")
    expect(seed.deliveryNoteRef).toBe("")
  })

  it("handles missing optional fields gracefully", () => {
    const seed = buildDuplicateSeed(
      makePayment({
        tag: undefined,
        surcharge: undefined,
        discount: undefined,
        deliveryNoteRef: undefined,
        paymentMethod: undefined,
      })
    )
    expect(seed.tag).toBe("")
    expect(seed.surcharge).toBe("")
    expect(seed.discount).toBe("")
    expect(seed.deliveryNoteRef).toBe("")
    expect(seed.paymentMethod).toBe("")
  })
})
