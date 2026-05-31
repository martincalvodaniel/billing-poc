import { describe, expect, test } from "bun:test"
import type { EventAttendee } from "@/lib/domain/entities/event"
import {
  compareEventsChronologicalAsc,
  eventIsPlottable,
  formatDuration,
  formatEventDateTime,
  formatTimeOfDay,
  parseTimeOfDay,
  totalSeats,
} from "./eventsUi"

describe("formatEventDateTime", () => {
  test("formats a full date", () => {
    expect(
      formatEventDateTime({
        date: "2026-04-29",
        year: 2026,
        month: 4,
        day: 29,
      })
    ).toBe("Apr 29, 2026")
  })

  test("appends a time when hour is set", () => {
    expect(
      formatEventDateTime({
        date: "2026-04-29",
        year: 2026,
        month: 4,
        day: 29,
        hour: 9,
        minute: 5,
      })
    ).toBe("Apr 29, 2026 09:05")
  })

  test("defaults minute to 00 when absent", () => {
    expect(
      formatEventDateTime({
        date: "2026-04-29",
        year: 2026,
        month: 4,
        day: 29,
        hour: 18,
      })
    ).toBe("Apr 29, 2026 18:00")
  })

  test("formats year+month only", () => {
    expect(formatEventDateTime({ date: undefined, year: 2026, month: 4 })).toBe(
      "April 2026"
    )
  })

  test("formats recurring events as 'Month YYYY Weekday(s) HH:MM'", () => {
    expect(
      formatEventDateTime({
        date: undefined,
        year: 2026,
        month: 4,
        dayOfWeek: 2,
        hour: 9,
        minute: 5,
      })
    ).toBe("April 2026 Tuesdays 09:05")
  })

  test("formats year only", () => {
    expect(formatEventDateTime({ date: undefined, year: 2026 })).toBe("2026")
  })

  test("formats time only", () => {
    expect(
      formatEventDateTime({
        date: undefined,
        hour: 10,
        minute: 30,
      })
    ).toBe("10:30")
  })

  test("returns 'No date' when nothing is set", () => {
    expect(formatEventDateTime({})).toBe("No date")
  })
})

describe("formatDuration", () => {
  test("returns em-dash for undefined or non-positive values", () => {
    expect(formatDuration(undefined)).toBe("—")
    expect(formatDuration(0)).toBe("—")
    expect(formatDuration(-30)).toBe("—")
  })

  test("formats minutes only when < 60", () => {
    expect(formatDuration(45)).toBe("45m")
    expect(formatDuration(1)).toBe("1m")
  })

  test("formats whole hours", () => {
    expect(formatDuration(60)).toBe("1h")
    expect(formatDuration(120)).toBe("2h")
  })

  test("formats hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m")
    expect(formatDuration(125)).toBe("2h 5m")
  })
})

describe("totalSeats", () => {
  test("returns 0 for empty list", () => {
    expect(totalSeats([])).toBe(0)
  })

  test("sums seats across attendees", () => {
    const attendees: EventAttendee[] = [
      { clientId: "a", seats: 2, addedAt: new Date() },
      { clientId: "b", seats: 3, addedAt: new Date() },
      { clientId: "c", seats: 1, addedAt: new Date() },
    ]
    expect(totalSeats(attendees)).toBe(6)
  })
})

describe("eventIsPlottable", () => {
  test("returns true when date is set", () => {
    expect(eventIsPlottable({ date: "2026-04-29" })).toBe(true)
  })
  test("returns false when date is undefined or empty", () => {
    expect(eventIsPlottable({ date: undefined })).toBe(false)
    expect(eventIsPlottable({ date: "" })).toBe(false)
  })
})

describe("formatTimeOfDay", () => {
  test("returns empty string when hour is undefined", () => {
    expect(formatTimeOfDay(undefined, undefined)).toBe("")
    expect(formatTimeOfDay(undefined, 30)).toBe("")
  })

  test("formats hour with zero padding and defaults minute to 0", () => {
    expect(formatTimeOfDay(9, undefined)).toBe("09:00")
    expect(formatTimeOfDay(0, 0)).toBe("00:00")
  })

  test("formats hour and minute with zero padding", () => {
    expect(formatTimeOfDay(18, 5)).toBe("18:05")
    expect(formatTimeOfDay(23, 59)).toBe("23:59")
  })
})

describe("parseTimeOfDay", () => {
  test("returns empty object for empty string", () => {
    expect(parseTimeOfDay("")).toEqual({})
    expect(parseTimeOfDay("   ")).toEqual({})
  })

  test("parses HH:MM", () => {
    expect(parseTimeOfDay("09:05")).toEqual({ hour: 9, minute: 5 })
    expect(parseTimeOfDay("23:59")).toEqual({ hour: 23, minute: 59 })
  })

  test("parses HH:MM:SS by ignoring seconds", () => {
    expect(parseTimeOfDay("18:30:00")).toEqual({ hour: 18, minute: 30 })
  })

  test("returns empty object for malformed values", () => {
    expect(parseTimeOfDay("abc")).toEqual({})
    expect(parseTimeOfDay("25:00")).toEqual({})
    expect(parseTimeOfDay("12:60")).toEqual({})
  })
})

describe("compareEventsChronologicalAsc", () => {
  type Cmp = Parameters<typeof compareEventsChronologicalAsc>[0]
  const make = (parts: Partial<Cmp> = {}): Cmp => ({
    createdAt: new Date(0),
    ...parts,
  })
  const sign = (n: number) => (n < 0 ? -1 : n > 0 ? 1 : 0)

  test("same day, one with no time comes first", () => {
    const noTime = make({ year: 2024, month: 1, day: 1 })
    const timed = make({ year: 2024, month: 1, day: 1, hour: 10, minute: 0 })
    expect(sign(compareEventsChronologicalAsc(noTime, timed))).toBe(-1)
    expect(sign(compareEventsChronologicalAsc(timed, noTime))).toBe(1)
  })

  test("same day, 09:30 < 10:00", () => {
    const earlier = make({ year: 2024, month: 1, day: 1, hour: 9, minute: 30 })
    const later = make({ year: 2024, month: 1, day: 1, hour: 10, minute: 0 })
    expect(sign(compareEventsChronologicalAsc(earlier, later))).toBe(-1)
  })

  test("same year/month, undefined day < day 1", () => {
    const noDay = make({ year: 2024, month: 1 })
    const day1 = make({ year: 2024, month: 1, day: 1 })
    expect(sign(compareEventsChronologicalAsc(noDay, day1))).toBe(-1)
  })

  test("same year, undefined month < month 1", () => {
    const noMonth = make({ year: 2024 })
    const m1 = make({ year: 2024, month: 1 })
    expect(sign(compareEventsChronologicalAsc(noMonth, m1))).toBe(-1)
  })

  test("undefined year < any year", () => {
    const noYear = make({})
    const y = make({ year: 2024 })
    expect(sign(compareEventsChronologicalAsc(noYear, y))).toBe(-1)
  })

  test("identical date fields tie-break by createdAt ascending", () => {
    const a = make({
      year: 2024,
      month: 1,
      day: 1,
      hour: 10,
      minute: 0,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    })
    const b = make({
      year: 2024,
      month: 1,
      day: 1,
      hour: 10,
      minute: 0,
      createdAt: new Date("2024-02-01T00:00:00Z"),
    })
    expect(sign(compareEventsChronologicalAsc(a, b))).toBe(-1)
    expect(sign(compareEventsChronologicalAsc(b, a))).toBe(1)
    expect(compareEventsChronologicalAsc(a, a)).toBe(0)
  })

  test("prompt example: same day, no time before timed", () => {
    const events = [
      make({ year: 2024, month: 1, day: 1, hour: 10, minute: 0 }),
      make({ year: 2024, month: 1, day: 1 }),
    ]
    const sorted = events.slice().sort(compareEventsChronologicalAsc)
    expect(sorted[0].hour).toBeUndefined()
    expect(sorted[1].hour).toBe(10)
  })

  test("prompt example: same month, no day before dated", () => {
    const events = [
      make({ year: 2024, month: 1, day: 1 }),
      make({ year: 2024, month: 1 }),
    ]
    const sorted = events.slice().sort(compareEventsChronologicalAsc)
    expect(sorted[0].day).toBeUndefined()
    expect(sorted[1].day).toBe(1)
  })

  test("full chronological ordering across mixed events", () => {
    const events = [
      make({ year: 2024, month: 2, day: 1 }),
      make({ year: 2024, month: 1, day: 1, hour: 10 }),
      make({ year: 2024, month: 1, day: 1 }),
      make({ year: 2024, month: 1 }),
      make({ year: 2024 }),
      make({}),
    ]
    const sorted = events.slice().sort(compareEventsChronologicalAsc)
    expect(sorted.map((e) => [e.year, e.month, e.day, e.hour])).toEqual([
      [undefined, undefined, undefined, undefined],
      [2024, undefined, undefined, undefined],
      [2024, 1, undefined, undefined],
      [2024, 1, 1, undefined],
      [2024, 1, 1, 10],
      [2024, 2, 1, undefined],
    ])
  })
})
