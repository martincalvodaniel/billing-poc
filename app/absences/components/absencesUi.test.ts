import { describe, expect, test } from "bun:test"
import { FetchError } from "@/lib/swr-fetcher"
import {
  extractAbsenceErrorMessage,
  PART_OF_DAY_LABEL,
  TYPE_DOT_CLASS,
  TYPE_LABEL,
} from "./absencesUi"

describe("extractAbsenceErrorMessage", () => {
  test("extracts error from FetchError info object", () => {
    const err = new FetchError("Bad request", 400, { error: "Conflict reason" })
    expect(extractAbsenceErrorMessage(err)).toBe("Conflict reason")
  })

  test("falls back to FetchError message when info has no error string", () => {
    const err = new FetchError("Boom", 500, { other: "x" })
    expect(extractAbsenceErrorMessage(err)).toBe("Boom")
  })

  test("falls back to FetchError message when info is null", () => {
    const err = new FetchError("Boom", 500, null)
    expect(extractAbsenceErrorMessage(err)).toBe("Boom")
  })

  test("uses Error.message for plain Error", () => {
    expect(extractAbsenceErrorMessage(new Error("nope"))).toBe("nope")
  })

  test("returns generic message for unknown values", () => {
    expect(extractAbsenceErrorMessage("string")).toBe("An error occurred")
    expect(extractAbsenceErrorMessage(undefined)).toBe("An error occurred")
    expect(extractAbsenceErrorMessage(null)).toBe("An error occurred")
    expect(extractAbsenceErrorMessage({ error: "x" })).toBe("An error occurred")
  })
})

describe("absences UI label maps", () => {
  test("PART_OF_DAY_LABEL covers both parts", () => {
    expect(PART_OF_DAY_LABEL.morning).toBe("Morning")
    expect(PART_OF_DAY_LABEL.evening).toBe("Evening")
  })

  test("TYPE_LABEL covers both types", () => {
    expect(TYPE_LABEL.absence).toBe("Absence")
    expect(TYPE_LABEL.recovery).toBe("Recovery")
  })

  test("TYPE_DOT_CLASS uses red for absence and green for recovery", () => {
    expect(TYPE_DOT_CLASS.absence).toBe("bg-red-500")
    expect(TYPE_DOT_CLASS.recovery).toBe("bg-green-500")
  })
})
