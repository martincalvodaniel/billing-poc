import { describe, expect, test } from "bun:test"
import {
  absenceQuerySchema,
  absenceStudentsQuerySchema,
  createAbsenceSchema,
  deleteAbsenceSchema,
  updateAbsenceSchema,
} from "./absence-validator"

describe("createAbsenceSchema", () => {
  const valid = {
    type: "absence",
    studentName: "Alice",
    date: "2026-04-29",
  }

  test("accepts valid absence", () => {
    const result = createAbsenceSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  test("accepts valid recovery with comment", () => {
    const result = createAbsenceSchema.safeParse({
      ...valid,
      type: "recovery",
      comment: "Made up Tuesday",
    })
    expect(result.success).toBe(true)
  })

  test("trims studentName", () => {
    const result = createAbsenceSchema.safeParse({
      ...valid,
      studentName: "  Bob  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.studentName).toBe("Bob")
    }
  })

  test("rejects missing studentName", () => {
    const { studentName: _s, ...rest } = valid
    const result = createAbsenceSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  test("rejects empty studentName after trim", () => {
    const result = createAbsenceSchema.safeParse({
      ...valid,
      studentName: "   ",
    })
    expect(result.success).toBe(false)
  })

  test("rejects studentName over 80 chars", () => {
    const result = createAbsenceSchema.safeParse({
      ...valid,
      studentName: "a".repeat(81),
    })
    expect(result.success).toBe(false)
  })

  test("rejects invalid type", () => {
    const result = createAbsenceSchema.safeParse({
      ...valid,
      type: "holiday",
    })
    expect(result.success).toBe(false)
  })

  test("rejects missing date", () => {
    const result = createAbsenceSchema.safeParse({ ...valid, date: "" })
    expect(result.success).toBe(false)
  })

  test("rejects comment over 500 chars", () => {
    const result = createAbsenceSchema.safeParse({
      ...valid,
      comment: "x".repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe("updateAbsenceSchema", () => {
  test("accepts id with one updatable field", () => {
    const result = updateAbsenceSchema.safeParse({
      id: "abc",
      studentName: "Carol",
    })
    expect(result.success).toBe(true)
  })

  test("accepts id with type only", () => {
    const result = updateAbsenceSchema.safeParse({
      id: "abc",
      type: "recovery",
    })
    expect(result.success).toBe(true)
  })

  test("rejects id only with no other fields", () => {
    const result = updateAbsenceSchema.safeParse({ id: "abc" })
    expect(result.success).toBe(false)
  })

  test("rejects missing id", () => {
    const result = updateAbsenceSchema.safeParse({ studentName: "Carol" })
    expect(result.success).toBe(false)
  })

  test("rejects empty id", () => {
    const result = updateAbsenceSchema.safeParse({
      id: "",
      studentName: "Carol",
    })
    expect(result.success).toBe(false)
  })
})

describe("deleteAbsenceSchema", () => {
  test("accepts valid id", () => {
    const result = deleteAbsenceSchema.safeParse({ id: "abc" })
    expect(result.success).toBe(true)
  })

  test("rejects missing id", () => {
    const result = deleteAbsenceSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  test("rejects empty id", () => {
    const result = deleteAbsenceSchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })
})

describe("absenceQuerySchema", () => {
  test("accepts empty input", () => {
    const result = absenceQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  test("coerces string month to number", () => {
    const result = absenceQuerySchema.safeParse({ year: "2026", month: "5" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.month).toBe(5)
      expect(result.data.year).toBe(2026)
    }
  })

  test("rejects month=13", () => {
    const result = absenceQuerySchema.safeParse({ month: 13 })
    expect(result.success).toBe(false)
  })

  test("rejects month=0", () => {
    const result = absenceQuerySchema.safeParse({ month: 0 })
    expect(result.success).toBe(false)
  })
})

describe("absenceStudentsQuerySchema", () => {
  test("accepts empty object", () => {
    const result = absenceStudentsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  test("accepts undefined q", () => {
    const result = absenceStudentsQuerySchema.safeParse({ q: undefined })
    expect(result.success).toBe(true)
  })

  test("accepts string q and trims it", () => {
    const result = absenceStudentsQuerySchema.safeParse({ q: "  Ali  " })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.q).toBe("Ali")
    }
  })
})
