import { describe, expect, test } from "bun:test"
import type { Event } from "@/lib/domain/entities/event"
import {
  buildDayAriaLabel,
  buildMonthCells,
  groupEventsByDate,
  mondayIndex,
  toDateKey,
} from "./calendarUtils"

function makeEvent(partial: Partial<Event> & { title: string }): Event {
  return {
    title: partial.title,
    pricePerSeat: 0,
    vatRate: 0,
    attendees: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  }
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

describe("groupEventsByDate", () => {
  test("returns an empty map for an empty list", () => {
    expect(groupEventsByDate([]).size).toBe(0)
  })

  test("groups events by their ISO date", () => {
    const events = [
      makeEvent({ title: "A", date: "2026-04-29" }),
      makeEvent({ title: "B", date: "2026-04-29" }),
      makeEvent({ title: "C", date: "2026-04-30" }),
    ]
    const map = groupEventsByDate(events)
    expect(map.get("2026-04-29")?.map((e) => e.title)).toEqual(["A", "B"])
    expect(map.get("2026-04-30")?.map((e) => e.title)).toEqual(["C"])
  })

  test("ignores events without a date", () => {
    const events = [
      makeEvent({ title: "Dated", date: "2026-04-29" }),
      makeEvent({ title: "Undated" }),
      makeEvent({ title: "Empty string", date: "" }),
    ]
    const map = groupEventsByDate(events)
    expect(map.size).toBe(1)
    expect(map.get("2026-04-29")?.map((e) => e.title)).toEqual(["Dated"])
  })
})

describe("buildMonthCells", () => {
  test("produces 42 cells aligned to Monday (parity with absences)", () => {
    // April 2026: April 1 is Wednesday; mondayIndex = 2
    const cells = buildMonthCells(new Date(2026, 3, 15), "2026-04-29")
    expect(cells).toHaveLength(42)
    expect(cells[0].key).toBe("2026-03-30")
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

describe("buildDayAriaLabel", () => {
  test("reports 'no events' when count is 0", () => {
    expect(buildDayAriaLabel(new Date(2026, 3, 29), 0)).toBe(
      "April 29, no events"
    )
  })
  test("uses singular for 1 and plural otherwise", () => {
    expect(buildDayAriaLabel(new Date(2026, 3, 29), 1)).toBe(
      "April 29, 1 event"
    )
    expect(buildDayAriaLabel(new Date(2026, 3, 29), 3)).toBe(
      "April 29, 3 events"
    )
  })
})
