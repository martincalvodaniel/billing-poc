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

  it("rejects missing taxId", () => {
    const { taxId: _, ...rest } = validClient
    const result = createClientSchema.safeParse(rest)
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
