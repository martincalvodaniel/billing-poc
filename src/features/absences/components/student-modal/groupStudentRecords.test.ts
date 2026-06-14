import { describe, expect, test } from "bun:test"
import type { Absence } from "@/lib/domain/entities/absence"
import { groupStudentRecords } from "./groupStudentRecords"

function rec(over: Partial<Absence>): Absence {
  return {
    studentName: "Alice",
    date: "2026-04-01",
    partOfDay: "morning",
    type: "absence",
    ...over,
  } as Absence
}

describe("groupStudentRecords", () => {
  test("returns [] for empty input", () => {
    expect(groupStudentRecords([])).toEqual([])
  })

  test("single record produces one date / part / type group", () => {
    const r = rec({ _id: "1" })
    const out = groupStudentRecords([r])
    expect(out.length).toBe(1)
    expect(out[0]?.date).toBe("2026-04-01")
    expect(out[0]?.parts.length).toBe(1)
    expect(out[0]?.parts[0]?.partOfDay).toBe("morning")
    expect(out[0]?.parts[0]?.types.length).toBe(1)
    expect(out[0]?.parts[0]?.types[0]?.type).toBe("absence")
    expect(out[0]?.parts[0]?.types[0]?.items).toEqual([r])
  })

  test("sorts dates descending", () => {
    const a = rec({ _id: "1", date: "2026-04-01" })
    const b = rec({ _id: "2", date: "2026-04-15" })
    const c = rec({ _id: "3", date: "2026-03-10" })
    const out = groupStudentRecords([a, b, c])
    expect(out.map((g) => g.date)).toEqual([
      "2026-04-15",
      "2026-04-01",
      "2026-03-10",
    ])
  })

  test("orders partOfDay morning before evening", () => {
    const evening = rec({ _id: "1", partOfDay: "evening" })
    const morning = rec({ _id: "2", partOfDay: "morning" })
    const out = groupStudentRecords([evening, morning])
    expect(out[0]?.parts.map((p) => p.partOfDay)).toEqual([
      "morning",
      "evening",
    ])
  })

  test("orders type absence before recovery within same part", () => {
    const recovery = rec({ _id: "1", type: "recovery" })
    const absence = rec({ _id: "2", type: "absence" })
    const out = groupStudentRecords([recovery, absence])
    expect(out[0]?.parts[0]?.types.map((t) => t.type)).toEqual([
      "absence",
      "recovery",
    ])
  })

  test("prunes empty part / type groups", () => {
    const r = rec({ _id: "1", partOfDay: "evening", type: "recovery" })
    const out = groupStudentRecords([r])
    expect(out[0]?.parts.length).toBe(1)
    expect(out[0]?.parts[0]?.partOfDay).toBe("evening")
    expect(out[0]?.parts[0]?.types.length).toBe(1)
    expect(out[0]?.parts[0]?.types[0]?.type).toBe("recovery")
  })

  test("groups multiple records of same type into items array", () => {
    const r1 = rec({ _id: "1" })
    const r2 = rec({ _id: "2" })
    const out = groupStudentRecords([r1, r2])
    expect(out[0]?.parts[0]?.types[0]?.items.length).toBe(2)
  })
})
