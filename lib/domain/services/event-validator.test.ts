import { describe, expect, test } from "bun:test"
import {
  addAttendeeSchema,
  createEventSchema,
  deleteEventSchema,
  eventQuerySchema,
  updateAttendeeSchema,
  updateEventSchema,
} from "./event-validator"

describe("createEventSchema", () => {
  const valid = {
    title: "Workshop",
    pricePerSeat: 50,
    vatRate: 21,
  }

  test("accepts minimal valid event", () => {
    const result = createEventSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  test("accepts event with full date and time", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      year: 2026,
      month: 5,
      day: 14,
      hour: 10,
      minute: 30,
      durationMinutes: 60,
      maxAttendees: 10,
    })
    expect(result.success).toBe(true)
  })

  test("trims title", () => {
    const result = createEventSchema.safeParse({ ...valid, title: "  Hi  " })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.title).toBe("Hi")
  })

  test("rejects empty title", () => {
    const result = createEventSchema.safeParse({ ...valid, title: "  " })
    expect(result.success).toBe(false)
  })

  test("rejects missing title", () => {
    const { title: _t, ...rest } = valid
    const result = createEventSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  test("rejects negative pricePerSeat", () => {
    const result = createEventSchema.safeParse({ ...valid, pricePerSeat: -1 })
    expect(result.success).toBe(false)
  })

  test("accepts pricePerSeat = 0", () => {
    const result = createEventSchema.safeParse({ ...valid, pricePerSeat: 0 })
    expect(result.success).toBe(true)
  })

  test("rejects vatRate < 0", () => {
    const result = createEventSchema.safeParse({ ...valid, vatRate: -1 })
    expect(result.success).toBe(false)
  })

  test("rejects vatRate > 100", () => {
    const result = createEventSchema.safeParse({ ...valid, vatRate: 101 })
    expect(result.success).toBe(false)
  })

  test("accepts vatRate = 0", () => {
    const result = createEventSchema.safeParse({ ...valid, vatRate: 0 })
    expect(result.success).toBe(true)
  })

  test("accepts vatRate = 100", () => {
    const result = createEventSchema.safeParse({ ...valid, vatRate: 100 })
    expect(result.success).toBe(true)
  })

  test("rejects missing pricePerSeat", () => {
    const { pricePerSeat: _p, ...rest } = valid
    const result = createEventSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  test("rejects missing vatRate", () => {
    const { vatRate: _v, ...rest } = valid
    const result = createEventSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  test("rejects month without year", () => {
    const result = createEventSchema.safeParse({ ...valid, month: 5 })
    expect(result.success).toBe(false)
  })

  test("rejects day without month", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      year: 2026,
      day: 14,
    })
    expect(result.success).toBe(false)
  })

  test("rejects day without year", () => {
    const result = createEventSchema.safeParse({ ...valid, day: 14 })
    expect(result.success).toBe(false)
  })

  test("rejects invalid Gregorian date (Feb 30)", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      year: 2026,
      month: 2,
      day: 30,
    })
    expect(result.success).toBe(false)
  })

  test("accepts Feb 29 on leap year", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      year: 2024,
      month: 2,
      day: 29,
    })
    expect(result.success).toBe(true)
  })

  test("rejects month out of range", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      year: 2026,
      month: 13,
    })
    expect(result.success).toBe(false)
  })

  test("rejects hour out of range", () => {
    const result = createEventSchema.safeParse({ ...valid, hour: 24 })
    expect(result.success).toBe(false)
  })

  test("rejects minute out of range", () => {
    const result = createEventSchema.safeParse({ ...valid, minute: 60 })
    expect(result.success).toBe(false)
  })

  test("rejects durationMinutes < 1", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      durationMinutes: 0,
    })
    expect(result.success).toBe(false)
  })

  test("rejects maxAttendees < 1", () => {
    const result = createEventSchema.safeParse({ ...valid, maxAttendees: 0 })
    expect(result.success).toBe(false)
  })

  test("accepts time-only (hour/minute) without date", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      hour: 9,
      minute: 0,
    })
    expect(result.success).toBe(true)
  })

  test("rejects title over 200 chars", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      title: "a".repeat(201),
    })
    expect(result.success).toBe(false)
  })

  test("rejects description over 2000 chars", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      description: "a".repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

describe("updateEventSchema", () => {
  test("accepts update with one field", () => {
    const result = updateEventSchema.safeParse({
      id: "abc",
      title: "New title",
    })
    expect(result.success).toBe(true)
  })

  test("rejects update with only id (no fields)", () => {
    const result = updateEventSchema.safeParse({ id: "abc" })
    expect(result.success).toBe(false)
  })

  test("rejects update without id", () => {
    const result = updateEventSchema.safeParse({ title: "x" })
    expect(result.success).toBe(false)
  })

  test("rejects invalid date in update (Feb 30)", () => {
    const result = updateEventSchema.safeParse({
      id: "abc",
      year: 2026,
      month: 2,
      day: 30,
    })
    expect(result.success).toBe(false)
  })

  test("rejects month without year in update", () => {
    const result = updateEventSchema.safeParse({ id: "abc", month: 5 })
    expect(result.success).toBe(false)
  })

  test("accepts update with valid full date", () => {
    const result = updateEventSchema.safeParse({
      id: "abc",
      year: 2026,
      month: 5,
      day: 14,
    })
    expect(result.success).toBe(true)
  })

  test("rejects negative pricePerSeat in update", () => {
    const result = updateEventSchema.safeParse({
      id: "abc",
      pricePerSeat: -1,
    })
    expect(result.success).toBe(false)
  })

  test("rejects vatRate > 100 in update", () => {
    const result = updateEventSchema.safeParse({
      id: "abc",
      vatRate: 101,
    })
    expect(result.success).toBe(false)
  })

  test("rejects vatRate < 0 in update", () => {
    const result = updateEventSchema.safeParse({
      id: "abc",
      vatRate: -1,
    })
    expect(result.success).toBe(false)
  })

  test("accepts pricePerSeat and vatRate update", () => {
    const result = updateEventSchema.safeParse({
      id: "abc",
      pricePerSeat: 12.5,
      vatRate: 10,
    })
    expect(result.success).toBe(true)
  })
})

describe("deleteEventSchema", () => {
  test("accepts valid id", () => {
    expect(deleteEventSchema.safeParse({ id: "abc" }).success).toBe(true)
  })

  test("rejects missing id", () => {
    expect(deleteEventSchema.safeParse({}).success).toBe(false)
  })

  test("rejects empty id", () => {
    expect(deleteEventSchema.safeParse({ id: "" }).success).toBe(false)
  })
})

describe("eventQuerySchema", () => {
  test("accepts empty query", () => {
    expect(eventQuerySchema.safeParse({}).success).toBe(true)
  })

  test("accepts year and month", () => {
    expect(eventQuerySchema.safeParse({ year: 2026, month: 5 }).success).toBe(
      true
    )
  })

  test("coerces string year", () => {
    const result = eventQuerySchema.safeParse({ year: "2026" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.year).toBe(2026)
  })

  test("rejects month 0", () => {
    expect(eventQuerySchema.safeParse({ month: 0 }).success).toBe(false)
  })

  test("rejects month 13", () => {
    expect(eventQuerySchema.safeParse({ month: 13 }).success).toBe(false)
  })
})

describe("addAttendeeSchema", () => {
  test("accepts valid attendee", () => {
    const result = addAttendeeSchema.safeParse({ clientId: "c1", seats: 2 })
    expect(result.success).toBe(true)
  })

  test("rejects missing clientId", () => {
    expect(addAttendeeSchema.safeParse({ seats: 1 }).success).toBe(false)
  })

  test("rejects empty clientId", () => {
    expect(
      addAttendeeSchema.safeParse({ clientId: "", seats: 1 }).success
    ).toBe(false)
  })

  test("rejects seats < 1", () => {
    expect(
      addAttendeeSchema.safeParse({ clientId: "c1", seats: 0 }).success
    ).toBe(false)
  })

  test("rejects non-integer seats", () => {
    expect(
      addAttendeeSchema.safeParse({ clientId: "c1", seats: 1.5 }).success
    ).toBe(false)
  })

  test("coerces string seats", () => {
    const result = addAttendeeSchema.safeParse({
      clientId: "c1",
      seats: "3",
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.seats).toBe(3)
  })
})

describe("updateAttendeeSchema", () => {
  test("accepts seats update", () => {
    expect(updateAttendeeSchema.safeParse({ seats: 2 }).success).toBe(true)
  })

  test("rejects empty patch", () => {
    expect(updateAttendeeSchema.safeParse({}).success).toBe(false)
  })

  test("rejects seats < 1", () => {
    expect(updateAttendeeSchema.safeParse({ seats: 0 }).success).toBe(false)
  })
})
