import { describe, expect, it } from "bun:test"
import { zodError } from "./validation"

describe("zodError", () => {
  it("extracts first issue message from Zod-like error", () => {
    const error = { issues: [{ message: "Name is required" }] }
    expect(zodError(error)).toBe("Name is required")
  })

  it("returns fallback for non-object", () => {
    expect(zodError(null)).toBe("Validation failed")
    expect(zodError(undefined)).toBe("Validation failed")
    expect(zodError("string")).toBe("Validation failed")
  })

  it("returns fallback for empty issues array", () => {
    expect(zodError({ issues: [] })).toBe("Validation failed")
  })

  it("returns fallback for object without issues", () => {
    expect(zodError({ message: "error" })).toBe("Validation failed")
  })
})
