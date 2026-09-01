import { describe, expect, test } from "bun:test"
import type { Product } from "@/lib/domain/entities/product"
import { buildSalePaymentFormData } from "./productPayment-utils"

const PRODUCT: Product = {
  _id: "product-1",
  name: "Small bowl firing",
  finalPrice: 12,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
}

describe("buildSalePaymentFormData", () => {
  test("builds a firing payment with the Cocción tag", () => {
    expect(
      buildSalePaymentFormData([PRODUCT], "Cocción", "2026-09-01")
    ).toEqual({
      type: "income",
      date: "2026-09-01",
      concepts: [
        {
          productId: "product-1",
          name: "Small bowl firing",
          amount: 12,
          quantity: 1,
        },
      ],
      vat: "21",
      surcharge: "",
      discount: "",
      tag: "Cocción",
      clientId: undefined,
      deliveryNoteRef: "",
      paymentMethod: "",
    })
  })
})
