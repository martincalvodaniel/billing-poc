"use client"

import { describe, expect, test } from "bun:test"
import {
  buildAbsenceStudentsKey,
  buildAbsenceStudentsUrl,
  isAbsenceStudentsKey,
} from "./useAbsenceStudents"

describe("buildAbsenceStudentsKey", () => {
  test("returns tuple with endpoint and query", () => {
    expect(buildAbsenceStudentsKey("ana")).toEqual([
      "/api/absences/students",
      "ana",
    ])
  })

  test("is stable for the same q", () => {
    const a = buildAbsenceStudentsKey("ana")
    const b = buildAbsenceStudentsKey("ana")
    expect(a).toEqual(b)
    expect(a[0]).toBe(b[0])
    expect(a[1]).toBe(b[1])
  })

  test("returns array of length 2", () => {
    const key = buildAbsenceStudentsKey("")
    expect(Array.isArray(key)).toBe(true)
    expect(key).toHaveLength(2)
    expect(key[0]).toBe("/api/absences/students")
  })
})

describe("buildAbsenceStudentsUrl", () => {
  test("omits ?q= when q is empty string", () => {
    expect(buildAbsenceStudentsUrl("")).toBe("/api/absences/students")
  })

  test("omits ?q= when q is whitespace only", () => {
    expect(buildAbsenceStudentsUrl("   ")).toBe("/api/absences/students")
    expect(buildAbsenceStudentsUrl("\t\n")).toBe("/api/absences/students")
  })

  test("includes trimmed q for normal queries", () => {
    expect(buildAbsenceStudentsUrl("ana")).toBe("/api/absences/students?q=ana")
  })

  test("trims surrounding whitespace before encoding", () => {
    expect(buildAbsenceStudentsUrl("  ana  ")).toBe(
      "/api/absences/students?q=ana"
    )
  })

  test("encodes spaces inside the query", () => {
    expect(buildAbsenceStudentsUrl("ana maria")).toBe(
      "/api/absences/students?q=ana%20maria"
    )
  })

  test("encodes accented characters", () => {
    expect(buildAbsenceStudentsUrl("José")).toBe(
      "/api/absences/students?q=Jos%C3%A9"
    )
  })

  test("encodes reserved URL characters", () => {
    expect(buildAbsenceStudentsUrl("a&b=c")).toBe(
      "/api/absences/students?q=a%26b%3Dc"
    )
  })
})

describe("isAbsenceStudentsKey", () => {
  test("returns true for a valid key", () => {
    expect(isAbsenceStudentsKey(["/api/absences/students", "ana"])).toBe(true)
  })

  test("returns true for a valid key with empty string q", () => {
    expect(isAbsenceStudentsKey(["/api/absences/students", ""])).toBe(true)
  })

  test("returns false for arrays with wrong endpoint", () => {
    expect(isAbsenceStudentsKey(["/api/absences", "ana"])).toBe(false)
    expect(isAbsenceStudentsKey(["/api/students", "ana"])).toBe(false)
  })

  test("returns false when q is not a string", () => {
    expect(isAbsenceStudentsKey(["/api/absences/students", 1])).toBe(false)
    expect(isAbsenceStudentsKey(["/api/absences/students", null])).toBe(false)
    expect(isAbsenceStudentsKey(["/api/absences/students", undefined])).toBe(
      false
    )
  })

  test("returns false for arrays with wrong length", () => {
    expect(isAbsenceStudentsKey(["/api/absences/students"])).toBe(false)
    expect(
      isAbsenceStudentsKey(["/api/absences/students", "ana", "extra"])
    ).toBe(false)
  })

  test("returns false for non-array values", () => {
    expect(isAbsenceStudentsKey("/api/absences/students?q=ana")).toBe(false)
    expect(
      isAbsenceStudentsKey({ url: "/api/absences/students", q: "ana" })
    ).toBe(false)
    expect(isAbsenceStudentsKey(null)).toBe(false)
    expect(isAbsenceStudentsKey(undefined)).toBe(false)
  })
})
