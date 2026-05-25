import { describe, expect, it } from "bun:test"
import { PAYMENT_METHODS } from "../entities/payment"
import {
  createPaymentSchema,
  deletePaymentSchema,
  paymentQuerySchema,
  updatePaymentSchema,
} from "./payment-validator"

describe("createPaymentSchema", () => {
  const validPayment = {
    type: "income",
    date: "2024-01-15",
    concepts: [{ name: "Service", amount: 100, quantity: 1 }],
    vat: 21,
  }

  it("accepts valid payment", () => {
    const result = createPaymentSchema.safeParse(validPayment)
    expect(result.success).toBe(true)
  })

  it("rejects missing type", () => {
    const { type: _, ...rest } = validPayment
    const result = createPaymentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it("rejects invalid type", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      type: "refund",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing date", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      date: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty concepts array", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      concepts: [],
    })
    expect(result.success).toBe(false)
  })

  it("rejects concept with empty name", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      concepts: [{ name: "", amount: 100, quantity: 1 }],
    })
    expect(result.success).toBe(false)
  })

  it("coerces string vat to number", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      vat: "21",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.vat).toBe(21)
    }
  })

  it("rejects vat > 100", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      vat: 101,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative vat", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      vat: -5,
    })
    expect(result.success).toBe(false)
  })

  it("defaults surcharge to 0", () => {
    const result = createPaymentSchema.safeParse(validPayment)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.surcharge).toBe(0)
    }
  })

  it("accepts optional fields", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      tag: "consulting",
      clientId: "abc123",
      deliveryNoteRef: "DN-001",
      surcharge: 5.2,
    })
    expect(result.success).toBe(true)
  })

  it("defaults discount to 0", () => {
    const result = createPaymentSchema.safeParse(validPayment)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.discount).toBe(0)
    }
  })

  it("accepts positive discount", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      discount: 25,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.discount).toBe(25)
    }
  })

  it("rejects negative discount", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      discount: -1,
    })
    expect(result.success).toBe(false)
  })

  it("rejects discount greater than concepts total", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      discount: 101,
    })
    expect(result.success).toBe(false)
  })

  it("coerces string discount to number", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      discount: "5",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.discount).toBe(5)
    }
  })

  it("accepts explicit discount = 0", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      discount: 0,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.discount).toBe(0)
    }
  })

  it("coerces empty string discount to 0", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      discount: "",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.discount).toBe(0)
    }
  })
})

describe("updatePaymentSchema", () => {
  it("accepts valid partial update", () => {
    const result = updatePaymentSchema.safeParse({
      id: "abc123",
      vat: 10,
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing id", () => {
    const result = updatePaymentSchema.safeParse({ vat: 10 })
    expect(result.success).toBe(false)
  })

  it("rejects id-only (no fields to update)", () => {
    const result = updatePaymentSchema.safeParse({ id: "abc123" })
    expect(result.success).toBe(false)
  })

  it("accepts discount = 0 on update", () => {
    const result = updatePaymentSchema.safeParse({
      id: "abc123",
      discount: 0,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.discount).toBe(0)
    }
  })

  it("coerces empty string discount to 0 on update", () => {
    const result = updatePaymentSchema.safeParse({
      id: "abc123",
      discount: "",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.discount).toBe(0)
    }
  })

  it("rejects negative discount on update", () => {
    const result = updatePaymentSchema.safeParse({
      id: "abc123",
      discount: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe("paymentMethod field", () => {
  const baseCreate = {
    type: "income",
    date: "2024-01-15",
    concepts: [{ name: "Service", amount: 100, quantity: 1 }],
    vat: 21,
  }

  for (const method of PAYMENT_METHODS) {
    it(`createPaymentSchema accepts paymentMethod="${method}"`, () => {
      const result = createPaymentSchema.safeParse({
        ...baseCreate,
        paymentMethod: method,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.paymentMethod).toBe(method)
      }
    })

    it(`updatePaymentSchema accepts paymentMethod="${method}"`, () => {
      const result = updatePaymentSchema.safeParse({
        id: "abc123",
        paymentMethod: method,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.paymentMethod).toBe(method)
      }
    })
  }

  it("createPaymentSchema treats empty string as undefined", () => {
    const result = createPaymentSchema.safeParse({
      ...baseCreate,
      paymentMethod: "",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.paymentMethod).toBeUndefined()
    }
  })

  it("updatePaymentSchema treats empty string as undefined", () => {
    const result = updatePaymentSchema.safeParse({
      id: "abc123",
      paymentMethod: "",
      vat: 10,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.paymentMethod).toBeUndefined()
    }
  })

  it("createPaymentSchema accepts missing paymentMethod", () => {
    const result = createPaymentSchema.safeParse(baseCreate)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.paymentMethod).toBeUndefined()
    }
  })

  it("updatePaymentSchema accepts missing paymentMethod", () => {
    const result = updatePaymentSchema.safeParse({
      id: "abc123",
      vat: 10,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.paymentMethod).toBeUndefined()
    }
  })

  it("createPaymentSchema rejects unknown paymentMethod", () => {
    const result = createPaymentSchema.safeParse({
      ...baseCreate,
      paymentMethod: "foo",
    })
    expect(result.success).toBe(false)
  })

  it("updatePaymentSchema rejects unknown paymentMethod", () => {
    const result = updatePaymentSchema.safeParse({
      id: "abc123",
      paymentMethod: "foo",
    })
    expect(result.success).toBe(false)
  })
})

describe("deletePaymentSchema", () => {
  it("accepts valid id", () => {
    const result = deletePaymentSchema.safeParse({ id: "abc123" })
    expect(result.success).toBe(true)
  })

  it("rejects empty id", () => {
    const result = deletePaymentSchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })
})

describe("paymentQuerySchema", () => {
  it("accepts empty params", () => {
    const result = paymentQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("coerces string year", () => {
    const result = paymentQuerySchema.safeParse({ year: "2024" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.year).toBe(2024)
    }
  })

  it("rejects month > 12", () => {
    const result = paymentQuerySchema.safeParse({ month: 13 })
    expect(result.success).toBe(false)
  })

  it("rejects month < 1", () => {
    const result = paymentQuerySchema.safeParse({ month: 0 })
    expect(result.success).toBe(false)
  })
})
