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
    partOfDay: "morning",
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

  test("rejects missing partOfDay", () => {
    const { partOfDay: _p, ...rest } = valid
    const result = createAbsenceSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  test("accepts partOfDay morning", () => {
    const result = createAbsenceSchema.safeParse({
      ...valid,
      partOfDay: "morning",
    })
    expect(result.success).toBe(true)
  })

  test("accepts partOfDay evening", () => {
    const result = createAbsenceSchema.safeParse({
      ...valid,
      partOfDay: "evening",
    })
    expect(result.success).toBe(true)
  })

  test("rejects invalid partOfDay", () => {
    const result = createAbsenceSchema.safeParse({
      ...valid,
      partOfDay: "afternoon",
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

  test("accepts id with partOfDay only", () => {
    const result = updateAbsenceSchema.safeParse({
      id: "abc",
      partOfDay: "evening",
    })
    expect(result.success).toBe(true)
  })

  test("rejects invalid partOfDay", () => {
    const result = updateAbsenceSchema.safeParse({
      id: "abc",
      partOfDay: "afternoon",
    })
    expect(result.success).toBe(false)
  })

  test("accepts empty comment (clearing existing comment)", () => {
    const result = updateAbsenceSchema.safeParse({
      id: "abc",
      comment: "",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.comment).toBe("")
    }
  })

  test("accepts whitespace-only comment as empty (clears comment)", () => {
    const result = updateAbsenceSchema.safeParse({
      id: "abc",
      comment: "   ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.comment).toBe("")
    }
  })
})

describe("deleteAbsenceSchema", () => {
  test("accepts id only", () => {
    const result = deleteAbsenceSchema.safeParse({ id: "abc" })
    expect(result.success).toBe(true)
  })

  test("accepts studentName only", () => {
    const result = deleteAbsenceSchema.safeParse({ studentName: "Alice" })
    expect(result.success).toBe(true)
    if (result.success && "studentName" in result.data) {
      expect(result.data.studentName).toBe("Alice")
    }
  })

  test("trims studentName", () => {
    const result = deleteAbsenceSchema.safeParse({ studentName: "  Bob  " })
    expect(result.success).toBe(true)
    if (result.success && "studentName" in result.data) {
      expect(result.data.studentName).toBe("Bob")
    }
  })

  test("rejects empty object", () => {
    const result = deleteAbsenceSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  test("rejects both id and studentName", () => {
    const result = deleteAbsenceSchema.safeParse({
      id: "abc",
      studentName: "Alice",
    })
    expect(result.success).toBe(false)
  })

  test("rejects empty id", () => {
    const result = deleteAbsenceSchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })

  test("rejects empty studentName", () => {
    const result = deleteAbsenceSchema.safeParse({ studentName: "   " })
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

  test("accepts studentName", () => {
    const result = absenceQuerySchema.safeParse({ studentName: "Alice" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.studentName).toBe("Alice")
    }
  })

  test("trims studentName", () => {
    const result = absenceQuerySchema.safeParse({ studentName: "  Alice  " })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.studentName).toBe("Alice")
    }
  })

  test("rejects empty studentName after trim", () => {
    const result = absenceQuerySchema.safeParse({ studentName: "   " })
    expect(result.success).toBe(false)
  })

  test("accepts year, month, and studentName combined", () => {
    const result = absenceQuerySchema.safeParse({
      year: "2026",
      month: "5",
      studentName: "Alice",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.year).toBe(2026)
      expect(result.data.month).toBe(5)
      expect(result.data.studentName).toBe("Alice")
    }
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
