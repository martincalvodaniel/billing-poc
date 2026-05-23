import { describe, expect, test } from "bun:test"
import { FetchError } from "../swr-fetcher"
import { buildAbsencesRequest, isConflictError } from "./useAbsenceMutations"

describe("buildAbsencesRequest", () => {
  test("builds POST request with JSON body and same-origin credentials", () => {
    const body = {
      type: "absence" as const,
      studentName: "Alice",
      date: "2026-04-29",
      partOfDay: "morning" as const,
    }
    const { url, init } = buildAbsencesRequest("POST", body)

    expect(url).toBe("/api/absences")
    expect(init.method).toBe("POST")
    expect(init.credentials).toBe("same-origin")
    expect(init.headers).toEqual({ "Content-Type": "application/json" })
    expect(init.body).toBe(JSON.stringify(body))
    expect(JSON.parse(init.body as string)).toMatchObject({
      partOfDay: "morning",
    })
  })

  test("builds PUT request preserving body shape including partOfDay", () => {
    const body = {
      id: "abc123",
      type: "recovery" as const,
      date: "2026-04-30",
      partOfDay: "evening" as const,
    }
    const { url, init } = buildAbsencesRequest("PUT", body)

    expect(url).toBe("/api/absences")
    expect(init.method).toBe("PUT")
    expect(init.body).toBe(JSON.stringify(body))
    expect(JSON.parse(init.body as string)).toMatchObject({
      partOfDay: "evening",
    })
  })

  test("builds DELETE request with id payload in body", () => {
    const body = { id: "abc123" }
    const { url, init } = buildAbsencesRequest("DELETE", body)

    expect(url).toBe("/api/absences")
    expect(init.method).toBe("DELETE")
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("builds DELETE request with studentName payload in body", () => {
    const body = { studentName: "Alice" }
    const { url, init } = buildAbsencesRequest("DELETE", body)

    expect(url).toBe("/api/absences")
    expect(init.method).toBe("DELETE")
    expect(init.body).toBe(JSON.stringify(body))
    expect(JSON.parse(init.body as string)).toEqual({ studentName: "Alice" })
  })
})

describe("isConflictError", () => {
  test("returns true for FetchError with status 409", () => {
    const err = new FetchError("conflict", 409, null)
    expect(isConflictError(err)).toBe(true)
  })

  test("returns false for FetchError with status 400", () => {
    const err = new FetchError("bad request", 400, null)
    expect(isConflictError(err)).toBe(false)
  })

  test("returns false for FetchError with status 500", () => {
    const err = new FetchError("server error", 500, null)
    expect(isConflictError(err)).toBe(false)
  })

  test("returns false for non-FetchError values", () => {
    expect(isConflictError(new Error("plain"))).toBe(false)
    expect(isConflictError({ status: 409 })).toBe(false)
    expect(isConflictError(null)).toBe(false)
    expect(isConflictError(undefined)).toBe(false)
    expect(isConflictError("409")).toBe(false)
  })
})
