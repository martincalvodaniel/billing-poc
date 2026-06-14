import { describe, expect, test } from "bun:test"
import type { PaymentTemplate } from "@/lib/domain/entities/payment-template"
import {
  buildCreatePaymentTemplatePayload,
  buildPaymentTemplateFormData,
} from "./utils"

const template: PaymentTemplate = {
  _id: "template-id",
  name: "Consulting",
  type: "income",
  concepts: [{ name: "Service", amount: 100, quantity: 1 }],
  vat: 21,
  surcharge: 5,
  discount: 10,
  tag: "monthly",
  clientId: "client-id",
  deliveryNoteRef: "DN-1",
  paymentMethod: "card",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
}

describe("buildPaymentTemplateFormData", () => {
  test("maps template fields to payment form data with a provided date", () => {
    const formData = buildPaymentTemplateFormData(template, "2026-06-14")
    expect(formData.date).toBe("2026-06-14")
    expect(formData.type).toBe("income")
    expect(formData.vat).toBe("21")
    expect(formData.surcharge).toBe("5")
    expect(formData.discount).toBe("10")
    expect(formData.tag).toBe("monthly")
    expect(formData.clientId).toBe("client-id")
    expect(formData.deliveryNoteRef).toBe("DN-1")
    expect(formData.paymentMethod).toBe("card")
  })
})

describe("buildCreatePaymentTemplatePayload", () => {
  test("trims text fields and converts numbers", () => {
    const payload = buildCreatePaymentTemplatePayload("  Consulting  ", {
      date: "2026-06-14",
      type: "income",
      concepts: [{ name: "Service", amount: 100, quantity: 1 }],
      vat: "21",
      surcharge: "5",
      discount: "10",
      tag: "  monthly  ",
      clientId: " client-id ",
      deliveryNoteRef: "  DN-1  ",
      paymentMethod: "card",
    })

    expect(payload).toEqual({
      name: "Consulting",
      type: "income",
      concepts: [{ name: "Service", amount: 100, quantity: 1 }],
      vat: 21,
      surcharge: 5,
      discount: 10,
      tag: "monthly",
      clientId: "client-id",
      deliveryNoteRef: "DN-1",
      paymentMethod: "card",
    })
  })
})
