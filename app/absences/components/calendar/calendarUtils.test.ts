import { describe, expect, test } from "bun:test"
import type { Absence } from "@/lib/domain/entities/absence"
import {
  aggregateByPart,
  buildAriaLabel,
  buildMonthCells,
  emptyDayCounts,
  mondayIndex,
  toDateKey,
} from "./calendarUtils"

function makeAbsence(
  partial: Partial<Absence> & Pick<Absence, "date" | "type" | "partOfDay">
): Absence {
  return {
    studentName: "X",
    ...partial,
  } as Absence
}

describe("toDateKey", () => {
  test("formats date in YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05")
    expect(toDateKey(new Date(2026, 11, 31))).toBe("2026-12-31")
  })
})

describe("mondayIndex", () => {
  test("returns 0 for Monday and 6 for Sunday", () => {
    // 2026-04-27 is a Monday
    expect(mondayIndex(new Date(2026, 3, 27))).toBe(0)
    // 2026-05-03 is a Sunday
    expect(mondayIndex(new Date(2026, 4, 3))).toBe(6)
    // 2026-04-30 is a Thursday
    expect(mondayIndex(new Date(2026, 3, 30))).toBe(3)
  })
})

describe("aggregateByPart", () => {
  test("returns empty map for empty records", () => {
    expect(aggregateByPart([]).size).toBe(0)
  })

  test("buckets by date, partOfDay and type", () => {
    const records: Absence[] = [
      makeAbsence({
        date: "2026-04-29",
        partOfDay: "morning",
        type: "absence",
      }),
      makeAbsence({
        date: "2026-04-29",
        partOfDay: "morning",
        type: "absence",
      }),
      makeAbsence({
        date: "2026-04-29",
        partOfDay: "morning",
        type: "recovery",
      }),
      makeAbsence({
        date: "2026-04-29",
        partOfDay: "evening",
        type: "recovery",
      }),
      makeAbsence({
        date: "2026-04-30",
        partOfDay: "evening",
        type: "absence",
      }),
    ]
    const map = aggregateByPart(records)
    expect(map.get("2026-04-29")).toEqual({
      morning: { absences: 2, recoveries: 1 },
      evening: { absences: 0, recoveries: 1 },
    })
    expect(map.get("2026-04-30")).toEqual({
      morning: { absences: 0, recoveries: 0 },
      evening: { absences: 1, recoveries: 0 },
    })
  })
})

describe("buildAriaLabel", () => {
  test("reports 'no records' for empty day", () => {
    const label = buildAriaLabel(new Date(2026, 3, 29), emptyDayCounts())
    expect(label).toBe("April 29, no records")
  })

  test("uses singular and plural correctly", () => {
    const label = buildAriaLabel(new Date(2026, 3, 29), {
      morning: { absences: 1, recoveries: 2 },
      evening: { absences: 0, recoveries: 1 },
    })
    expect(label).toBe(
      "April 29, Morning: 1 absence, 2 recoveries; Evening: 0 absences, 1 recovery"
    )
  })
})

describe("buildMonthCells", () => {
  test("produces 42 cells aligned to Monday", () => {
    // April 2026: April 1 is Wednesday; mondayIndex = 2
    const cells = buildMonthCells(new Date(2026, 3, 15), "2026-04-29")
    expect(cells).toHaveLength(42)
    expect(cells[0].key).toBe("2026-03-30") // Monday before April 1
    expect(cells[0].inMonth).toBe(false)
    const apr1 = cells[2]
    expect(apr1.key).toBe("2026-04-01")
    expect(apr1.inMonth).toBe(true)
  })

  test("marks the cell matching todayKey", () => {
    const cells = buildMonthCells(new Date(2026, 3, 15), "2026-04-29")
    const today = cells.find((c) => c.key === "2026-04-29")
    expect(today?.isToday).toBe(true)
    const other = cells.find((c) => c.key === "2026-04-28")
    expect(other?.isToday).toBe(false)
  })

  test("marks cells outside the selected month as not inMonth", () => {
    const cells = buildMonthCells(new Date(2026, 3, 15), "2026-04-29")
    expect(cells.filter((c) => !c.inMonth).length).toBeGreaterThan(0)
    expect(cells.filter((c) => c.inMonth).length).toBe(30) // April has 30 days
  })
})
