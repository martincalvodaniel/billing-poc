import { describe, expect, test } from "bun:test"
import {
  createPaymentTemplateSchema,
  deletePaymentTemplateSchema,
  updatePaymentTemplateSchema,
} from "./payment-template-validator"

describe("createPaymentTemplateSchema", () => {
  const valid = {
    name: "Consulting template",
    type: "income",
    concepts: [{ name: "Service", amount: 100, quantity: 1 }],
    vat: 21,
  }

  test("accepts a valid template", () => {
    expect(createPaymentTemplateSchema.safeParse(valid).success).toBe(true)
  })

  test("trims the template name", () => {
    const result = createPaymentTemplateSchema.safeParse({
      ...valid,
      name: "  Consulting template  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Consulting template")
    }
  })

  test("rejects an empty name", () => {
    expect(
      createPaymentTemplateSchema.safeParse({ ...valid, name: "   " }).success
    ).toBe(false)
  })

  test("accepts optional fields", () => {
    const result = createPaymentTemplateSchema.safeParse({
      ...valid,
      surcharge: 5,
      discount: 10,
      tag: "monthly",
      clientId: "client-id",
      deliveryNoteRef: "DN-001",
      paymentMethod: "card",
    })
    expect(result.success).toBe(true)
  })

  test("rejects discount greater than concepts total", () => {
    expect(
      createPaymentTemplateSchema.safeParse({
        ...valid,
        discount: 101,
      }).success
    ).toBe(false)
  })
})

describe("updatePaymentTemplateSchema", () => {
  test("accepts a partial update with trimmed fields", () => {
    const result = updatePaymentTemplateSchema.safeParse({
      id: "template-id",
      name: "  Updated template  ",
      tag: "  monthly  ",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Updated template")
      expect(result.data.tag).toBe("monthly")
    }
  })

  test("rejects empty updates", () => {
    expect(
      updatePaymentTemplateSchema.safeParse({ id: "template-id" }).success
    ).toBe(false)
  })

  test("rejects discount greater than concepts total when concepts are updated", () => {
    expect(
      updatePaymentTemplateSchema.safeParse({
        id: "template-id",
        concepts: [{ name: "Service", amount: 100, quantity: 1 }],
        discount: 101,
      }).success
    ).toBe(false)
  })
})

describe("deletePaymentTemplateSchema", () => {
  test("requires an id", () => {
    expect(deletePaymentTemplateSchema.safeParse({}).success).toBe(false)
  })
})
