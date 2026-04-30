import { describe, expect, test } from "bun:test"
import type { Absence } from "../entities/absence"
import { computeAbsenceSummary, mergeStudentNames } from "./absence-summary"

function absence(
  partial: Partial<Absence> & Pick<Absence, "studentName" | "date" | "type">
): Absence {
  return {
    studentName: partial.studentName,
    date: partial.date,
    type: partial.type,
    comment: partial.comment,
    createdAt: partial.createdAt ?? new Date("2026-01-01T00:00:00Z"),
    updatedAt: partial.updatedAt ?? new Date("2026-01-01T00:00:00Z"),
  }
}

describe("computeAbsenceSummary", () => {
  test("empty input returns []", () => {
    expect(computeAbsenceSummary([])).toEqual([])
  })

  test("single absence yields one row with pending=1", () => {
    const rows = computeAbsenceSummary([
      absence({ studentName: "Alice", date: "2026-04-10", type: "absence" }),
    ])
    expect(rows).toEqual([
      {
        studentName: "Alice",
        totalAbsences: 1,
        totalRecoveries: 0,
        pending: 1,
        lastAbsenceDate: "2026-04-10",
      },
    ])
  })

  test("recoveries exceeding absences produce negative pending and ignore recovery dates", () => {
    const rows = computeAbsenceSummary([
      absence({ studentName: "Bob", date: "2026-04-05", type: "absence" }),
      absence({ studentName: "Bob", date: "2026-04-06", type: "recovery" }),
      absence({ studentName: "Bob", date: "2026-04-20", type: "recovery" }),
    ])
    expect(rows).toHaveLength(1)
    const [row] = rows
    expect(row.totalAbsences).toBe(1)
    expect(row.totalRecoveries).toBe(2)
    expect(row.pending).toBe(-1)
    expect(row.lastAbsenceDate).toBe("2026-04-05")
  })

  test("groups names case-insensitively and preserves first-seen casing", () => {
    const rows = computeAbsenceSummary([
      absence({ studentName: "Maria", date: "2026-04-01", type: "absence" }),
      absence({ studentName: "MARIA", date: "2026-04-15", type: "absence" }),
      absence({ studentName: "maria", date: "2026-04-10", type: "recovery" }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      studentName: "Maria",
      totalAbsences: 2,
      totalRecoveries: 1,
      pending: 1,
      lastAbsenceDate: "2026-04-15",
    })
  })

  test("rows are sorted by studentName ascending case-insensitively", () => {
    const rows = computeAbsenceSummary([
      absence({ studentName: "charlie", date: "2026-04-01", type: "absence" }),
      absence({ studentName: "Alice", date: "2026-04-02", type: "absence" }),
      absence({ studentName: "bob", date: "2026-04-03", type: "absence" }),
    ])
    expect(rows.map((r) => r.studentName)).toEqual(["Alice", "bob", "charlie"])
  })

  test("group with only recoveries has lastAbsenceDate=null", () => {
    const rows = computeAbsenceSummary([
      absence({ studentName: "Dana", date: "2026-04-10", type: "recovery" }),
    ])
    expect(rows[0].lastAbsenceDate).toBeNull()
    expect(rows[0].pending).toBe(-1)
  })
})

describe("mergeStudentNames", () => {
  test("dedupes across both lists case-insensitively, preserves first-seen casing, and sorts", () => {
    const merged = mergeStudentNames(
      ["Alice", "  bob  ", "MARIA"],
      ["alice", "Carol", "maria"]
    )
    expect(merged).toEqual(["Alice", "bob", "Carol", "MARIA"])
  })

  test("trims whitespace and skips empty entries", () => {
    const merged = mergeStudentNames(["  ", "Eve "], [" eve", ""])
    expect(merged).toEqual(["Eve"])
  })

  test("empty inputs return []", () => {
    expect(mergeStudentNames([], [])).toEqual([])
  })
})
