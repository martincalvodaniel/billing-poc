import { describe, expect, test } from "bun:test"
import { buildAbsencesRequest } from "./useAbsenceMutations"

describe("buildAbsencesRequest", () => {
  test("builds POST request with JSON body and same-origin credentials", () => {
    const body = {
      type: "absence" as const,
      studentName: "Alice",
      date: "2026-04-29",
      comment: "Sick",
    }
    const { url, init } = buildAbsencesRequest("POST", body)

    expect(url).toBe("/api/absences")
    expect(init.method).toBe("POST")
    expect(init.credentials).toBe("same-origin")
    expect(init.headers).toEqual({ "Content-Type": "application/json" })
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("builds PUT request preserving body shape", () => {
    const body = {
      id: "abc123",
      type: "recovery" as const,
      date: "2026-04-30",
    }
    const { url, init } = buildAbsencesRequest("PUT", body)

    expect(url).toBe("/api/absences")
    expect(init.method).toBe("PUT")
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("builds DELETE request with id payload in body", () => {
    const body = { id: "abc123" }
    const { url, init } = buildAbsencesRequest("DELETE", body)

    expect(url).toBe("/api/absences")
    expect(init.method).toBe("DELETE")
    expect(init.body).toBe(JSON.stringify(body))
  })
})
