import { describe, expect, test } from "bun:test"
import type { EventAttendee } from "@/lib/domain/entities/event"
import {
  eventIsPlottable,
  formatDuration,
  formatEventDateTime,
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
