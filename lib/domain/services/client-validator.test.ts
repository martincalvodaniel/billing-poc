import { describe, expect, it } from "bun:test"
import {
  clientQuerySchema,
  createClientSchema,
  deleteClientSchema,
  updateClientSchema,
} from "./client-validator"

describe("createClientSchema", () => {
  const validClient = {
    clientType: "company",
    name: "Acme Corp",
    taxId: "B12345678",
    address: "123 Main St",
  }

  it("accepts valid client", () => {
    const result = createClientSchema.safeParse(validClient)
    expect(result.success).toBe(true)
  })

  it("rejects missing name", () => {
    const { name: _, ...rest } = validClient
    const result = createClientSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it("rejects empty name", () => {
    const result = createClientSchema.safeParse({ ...validClient, name: "" })
    expect(result.success).toBe(false)
  })

  it("accepts client with only name (taxId and address optional)", () => {
    const result = createClientSchema.safeParse({
      clientType: "individual",
      name: "Jane Doe",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.taxId).toBeUndefined()
      expect(result.data.address).toBeUndefined()
    }
  })

  it("accepts taxId-only (without address)", () => {
    const result = createClientSchema.safeParse({
      clientType: "company",
      name: "Acme",
      taxId: "B123",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.taxId).toBe("B123")
      expect(result.data.address).toBeUndefined()
    }
  })

  it("accepts address-only (without taxId)", () => {
    const result = createClientSchema.safeParse({
      clientType: "company",
      name: "Acme",
      address: "1 Main St",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.address).toBe("1 Main St")
      expect(result.data.taxId).toBeUndefined()
    }
  })

  it("normalises empty taxId after trim to undefined", () => {
    const result = createClientSchema.safeParse({
      ...validClient,
      taxId: "   ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.taxId).toBeUndefined()
    }
  })

  it("rejects missing taxId only when name is also missing", () => {
    const result = createClientSchema.safeParse({
      clientType: "company",
      address: "1 Main St",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid clientType", () => {
    const result = createClientSchema.safeParse({
      ...validClient,
      clientType: "other",
    })
    expect(result.success).toBe(false)
  })

  it("trims whitespace from name", () => {
    const result = createClientSchema.safeParse({
      ...validClient,
      name: "  Acme Corp  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Acme Corp")
    }
  })

  it("accepts optional phone and email", () => {
    const result = createClientSchema.safeParse({
      ...validClient,
      phone: "555-0100",
      email: "info@acme.com",
    })
    expect(result.success).toBe(true)
  })
})

describe("updateClientSchema", () => {
  it("accepts valid partial update", () => {
    const result = updateClientSchema.safeParse({
      id: "abc123",
      name: "New Name",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing id", () => {
    const result = updateClientSchema.safeParse({ name: "New Name" })
    expect(result.success).toBe(false)
  })

  it("rejects id-only (no fields to update)", () => {
    const result = updateClientSchema.safeParse({ id: "abc123" })
    expect(result.success).toBe(false)
  })

  it("rejects empty name", () => {
    const result = updateClientSchema.safeParse({ id: "abc123", name: "" })
    expect(result.success).toBe(false)
  })
})

describe("deleteClientSchema", () => {
  it("accepts valid id", () => {
    const result = deleteClientSchema.safeParse({ id: "abc123" })
    expect(result.success).toBe(true)
  })

  it("rejects empty id", () => {
    const result = deleteClientSchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })
})

describe("clientQuerySchema", () => {
  it("defaults page and pageSize", () => {
    const result = clientQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(10)
    }
  })

  it("coerces string page to number", () => {
    const result = clientQuerySchema.safeParse({ page: "3" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
    }
  })

  it("rejects page < 1", () => {
    const result = clientQuerySchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it("rejects pageSize > 100", () => {
    const result = clientQuerySchema.safeParse({ pageSize: 101 })
    expect(result.success).toBe(false)
  })

  it("accepts search query", () => {
    const result = clientQuerySchema.safeParse({ search: "acme" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.search).toBe("acme")
    }
  })
})
