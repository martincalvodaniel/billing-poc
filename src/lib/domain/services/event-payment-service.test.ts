import { describe, expect, test } from "bun:test"
import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import type { Payment } from "@/lib/domain/entities/payment"
import type { EventRepository } from "@/lib/domain/ports/event-repository"
import type { PaymentRepository } from "@/lib/domain/ports/payment-repository"
import {
  generateAttendeePayment,
  recomputeAttendeePayment,
  unlinkPaymentFromEvents,
} from "./event-payment-service"

function makeEvent(overrides: Partial<Event> = {}): Event {
  const now = new Date("2026-05-14T00:00:00Z")
  return {
    _id: "ev1",
    title: "Workshop",
    year: 2026,
    month: 5,
    day: 14,
    hour: undefined,
    minute: undefined,
    date: "2026-05-14",
    durationMinutes: 60,
    maxAttendees: 10,
    pricePerSeat: 50,
    vatRate: 0,
    attendees: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeAttendee(overrides: Partial<EventAttendee> = {}): EventAttendee {
  return {
    clientId: "cli1",
    seats: 1,
    paymentId: "pay1",
    addedAt: new Date("2026-05-14T00:00:00Z"),
    ...overrides,
  }
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  const now = new Date("2026-05-14T00:00:00Z")
  return {
    _id: "pay1",
    type: "income",
    date: "2026-05-14",
    tag: "event",
    clientId: "cli1",
    concepts: [{ name: "Workshop", amount: 50, quantity: 1 }],
    vat: 0,
    netAmount: 50,
    vatAmount: 0,
    total: 50,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

interface UpdateCall {
  id: string
  data: Partial<Payment>
}

function makeFakeRepo(initial: Payment | null): {
  repo: PaymentRepository
  updates: UpdateCall[]
} {
  const updates: UpdateCall[] = []
  const repo: PaymentRepository = {
    findAll: async () => [],
    findById: async (id) => (initial && initial._id === id ? initial : null),
    create: async () => "unused",
    update: async (id, data) => {
      updates.push({ id, data })
      return true
    },
    delete: async () => true,
    findDistinctTags: async () => [],
  }
  return { repo, updates }
}

describe("recomputeAttendeePayment", () => {
  test("returns 'missing' when attendee has no paymentId", async () => {
    const { repo, updates } = makeFakeRepo(null)
    const result = await recomputeAttendeePayment(
      makeEvent(),
      makeAttendee({ paymentId: undefined }),
      3,
      { payments: repo }
    )
    expect(result).toEqual({ status: "missing" })
    expect(updates).toHaveLength(0)
  })

  test("returns 'missing' when payment is not found", async () => {
    const { repo, updates } = makeFakeRepo(null)
    const result = await recomputeAttendeePayment(
      makeEvent(),
      makeAttendee({ paymentId: "ghost" }),
      3,
      { payments: repo }
    )
    expect(result).toEqual({ status: "missing" })
    expect(updates).toHaveLength(0)
  })

  test("returns 'invoiced' when payment has invoice metadata", async () => {
    const payment = makePayment({
      invoice: {
        type: "Invoice",
        id: "F26_042",
        generatedAt: new Date("2026-05-14T10:00:00Z"),
      },
    })
    const { repo, updates } = makeFakeRepo(payment)
    const result = await recomputeAttendeePayment(
      makeEvent(),
      makeAttendee({ paymentId: "pay1" }),
      5,
      { payments: repo }
    )
    expect(result).toEqual({
      status: "invoiced",
      paymentId: "pay1",
      invoiceType: "Invoice",
      invoiceId: "F26_042",
    })
    expect(updates).toHaveLength(0)
  })

  test("returns 'updated' and persists new amounts/concepts when no invoice", async () => {
    const payment = makePayment()
    const { repo, updates } = makeFakeRepo(payment)
    const result = await recomputeAttendeePayment(
      makeEvent({ pricePerSeat: 50, vatRate: 0, durationMinutes: 60 }),
      makeAttendee({ paymentId: "pay1", seats: 1 }),
      3,
      { payments: repo }
    )
    expect(result).toEqual({
      status: "updated",
      paymentId: "pay1",
      netAmount: 150,
      vatAmount: 0,
      total: 150,
    })
    expect(updates).toHaveLength(1)
    expect(updates[0].id).toBe("pay1")
    expect(updates[0].data.netAmount).toBe(150)
    expect(updates[0].data.vatAmount).toBe(0)
    expect(updates[0].data.total).toBe(150)
    expect(updates[0].data.concepts).toEqual([
      { name: "Workshop", amount: 50, quantity: 3 },
    ])
    expect(updates[0].data.updatedAt).toBeInstanceOf(Date)
  })

  test("'updated' preserves the existing concept name from the payment", async () => {
    const payment = makePayment({
      concepts: [{ name: "Custom edited name", amount: 50, quantity: 1 }],
    })
    const { repo, updates } = makeFakeRepo(payment)
    const result = await recomputeAttendeePayment(
      makeEvent(),
      makeAttendee({ paymentId: "pay1" }),
      2,
      { payments: repo }
    )
    expect(result.status).toBe("updated")
    expect(updates[0].data.concepts).toEqual([
      { name: "Custom edited name", amount: 50, quantity: 2 },
    ])
  })

  test("'updated' does NOT scale per-line amount by duration", async () => {
    // 50 € gross per seat, 120 min duration, 2 seats → per-line = 50 (duration ignored)
    // total = 50 * 2 = 100
    const payment = makePayment({ concepts: [] })
    const { repo, updates } = makeFakeRepo(payment)
    const result = await recomputeAttendeePayment(
      makeEvent({
        pricePerSeat: 50,
        vatRate: 0,
        durationMinutes: 120,
        hour: 9,
        minute: 5,
      }),
      makeAttendee({ paymentId: "pay1" }),
      2,
      { payments: repo }
    )
    expect(result).toEqual({
      status: "updated",
      paymentId: "pay1",
      netAmount: 100,
      vatAmount: 0,
      total: 100,
    })
    expect(updates[0].data.concepts).toEqual([
      { name: "Workshop (14 May 09:05)", amount: 50, quantity: 2 },
    ])
  })

  test("'updated' falls back to event title with date when concept name absent", async () => {
    const payment = makePayment({ concepts: [] })
    const { repo, updates } = makeFakeRepo(payment)
    await recomputeAttendeePayment(
      makeEvent({ title: "Yoga class", hour: 17, minute: 30 }),
      makeAttendee({ paymentId: "pay1" }),
      1,
      { payments: repo }
    )
    expect(updates[0].data.concepts?.[0].name).toBe("Yoga class (14 May 17:30)")
  })

  test("'updated' keeps title unchanged when event has no date", async () => {
    const payment = makePayment({ concepts: [] })
    const { repo, updates } = makeFakeRepo(payment)
    await recomputeAttendeePayment(
      makeEvent({
        title: "Workshop",
        date: undefined,
        year: undefined,
        month: undefined,
        day: undefined,
      }),
      makeAttendee({ paymentId: "pay1" }),
      1,
      { payments: repo }
    )
    expect(updates[0].data.concepts?.[0].name).toBe("Workshop")
  })

  test("'updated' includes recurrent weekday in generated concept name", async () => {
    const payment = makePayment({ concepts: [] })
    const { repo, updates } = makeFakeRepo(payment)
    await recomputeAttendeePayment(
      makeEvent({
        date: undefined,
        day: undefined,
        dayOfWeek: 2,
        hour: 10,
        minute: 0,
      }),
      makeAttendee({ paymentId: "pay1" }),
      1,
      { payments: repo }
    )
    expect(updates[0].data.concepts?.[0].name).toBe(
      "Workshop (Martes May 10:00)"
    )
  })
})

interface CreateCall {
  data: Omit<Payment, "_id">
}

function makeFakeCreateRepo(): {
  payments: PaymentRepository
  events: EventRepository
  creates: CreateCall[]
  attendeeUpdates: Array<{
    eventId: string
    clientId: string
    patch: { seats?: number; paymentId?: string | null }
  }>
} {
  const creates: CreateCall[] = []
  const attendeeUpdates: Array<{
    eventId: string
    clientId: string
    patch: { seats?: number; paymentId?: string | null }
  }> = []
  const payments: PaymentRepository = {
    findAll: async () => [],
    findById: async () => null,
    create: async (data) => {
      creates.push({ data })
      return "pay-new"
    },
    update: async () => true,
    delete: async () => true,
    findDistinctTags: async () => [],
  }
  const events: EventRepository = {
    findAll: async () => [],
    findById: async () => null,
    create: async () => "ev-new",
    update: async () => true,
    delete: async () => true,
    addAttendee: async () => true,
    updateAttendee: async (eventId, clientId, patch) => {
      attendeeUpdates.push({ eventId, clientId, patch })
      return true
    },
    removeAttendee: async () => true,
  }
  return { payments, events, creates, attendeeUpdates }
}

function todayLocalISOForTest(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

describe("generateAttendeePayment", () => {
  test("sets payment date to today even when event has a date", async () => {
    const today = todayLocalISOForTest()
    const { payments, events, creates, attendeeUpdates } = makeFakeCreateRepo()
    const event = makeEvent({ date: "2020-01-01" })
    const attendee = makeAttendee({ paymentId: undefined, seats: 2 })

    const paymentId = await generateAttendeePayment(event, attendee, {
      payments,
      events,
    })

    expect(paymentId).toBe("pay-new")
    expect(creates).toHaveLength(1)
    const created = creates[0].data
    expect(created.date).not.toBe(event.date)
    expect(created.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(created.date).toBe(today)
    expect(attendeeUpdates).toEqual([
      { eventId: "ev1", clientId: "cli1", patch: { paymentId: "pay-new" } },
    ])
  })

  test("sets payment date to today when event has no date", async () => {
    const today = todayLocalISOForTest()
    const { payments, events, creates } = makeFakeCreateRepo()
    const event = makeEvent({
      date: undefined,
      year: undefined,
      month: undefined,
      day: undefined,
    })
    const attendee = makeAttendee({ paymentId: undefined })

    await generateAttendeePayment(event, attendee, { payments, events })

    expect(creates).toHaveLength(1)
    expect(creates[0].data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(creates[0].data.date).toBe(today)
  })

  test("persists selected payment method when provided", async () => {
    const { payments, events, creates } = makeFakeCreateRepo()
    const event = makeEvent({ date: "2026-05-01" })
    const attendee = makeAttendee({ paymentId: undefined })

    await generateAttendeePayment(event, attendee, {
      payments,
      events,
      paymentMethod: "bank_transfer",
    })

    expect(creates).toHaveLength(1)
    expect(creates[0].data.paymentMethod).toBe("bank_transfer")
  })
})

describe("unlinkPaymentFromEvents", () => {
  test("clears paymentId for all attendees linked to the deleted payment", async () => {
    const now = new Date("2026-05-14T00:00:00Z")
    const eventRepoCalls: Array<{
      eventId: string
      clientId: string
      patch: { seats?: number; paymentId?: string | null }
    }> = []

    const eventsRepo: EventRepository = {
      findAll: async () => [
        {
          _id: "ev1",
          title: "Event 1",
          year: 2026,
          month: 5,
          day: 14,
          date: "2026-05-14",
          durationMinutes: 60,
          maxAttendees: 10,
          pricePerSeat: 50,
          vatRate: 0,
          attendees: [
            {
              clientId: "c1",
              seats: 1,
              paymentId: "pay-1",
              addedAt: now,
            },
            {
              clientId: "c2",
              seats: 1,
              paymentId: "pay-2",
              addedAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "ev2",
          title: "Event 2",
          year: 2026,
          month: 5,
          day: 15,
          date: "2026-05-15",
          durationMinutes: 60,
          maxAttendees: 10,
          pricePerSeat: 50,
          vatRate: 0,
          attendees: [
            {
              clientId: "c3",
              seats: 2,
              paymentId: "pay-1",
              addedAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
      findById: async () => null,
      create: async () => "ev-new",
      update: async () => true,
      delete: async () => true,
      addAttendee: async () => true,
      updateAttendee: async (eventId, clientId, patch) => {
        eventRepoCalls.push({ eventId, clientId, patch })
        return true
      },
      removeAttendee: async () => true,
    }

    const result = await unlinkPaymentFromEvents("pay-1", {
      events: eventsRepo,
    })

    expect(result).toEqual({ updatedAttendees: 2, updatedEvents: 2 })
    expect(eventRepoCalls).toEqual([
      { eventId: "ev1", clientId: "c1", patch: { paymentId: null } },
      { eventId: "ev2", clientId: "c3", patch: { paymentId: null } },
    ])
  })

  test("returns zero updates when no attendee references the payment", async () => {
    const now = new Date("2026-05-14T00:00:00Z")
    const eventRepoCalls: Array<{
      eventId: string
      clientId: string
      patch: { seats?: number; paymentId?: string | null }
    }> = []

    const eventsRepo: EventRepository = {
      findAll: async () => [
        {
          _id: "ev1",
          title: "Event 1",
          year: 2026,
          month: 5,
          day: 14,
          date: "2026-05-14",
          durationMinutes: 60,
          maxAttendees: 10,
          pricePerSeat: 50,
          vatRate: 0,
          attendees: [
            {
              clientId: "c1",
              seats: 1,
              paymentId: "pay-2",
              addedAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
      findById: async () => null,
      create: async () => "ev-new",
      update: async () => true,
      delete: async () => true,
      addAttendee: async () => true,
      updateAttendee: async (eventId, clientId, patch) => {
        eventRepoCalls.push({ eventId, clientId, patch })
        return true
      },
      removeAttendee: async () => true,
    }

    const result = await unlinkPaymentFromEvents("pay-1", {
      events: eventsRepo,
    })

    expect(result).toEqual({ updatedAttendees: 0, updatedEvents: 0 })
    expect(eventRepoCalls).toEqual([])
  })
})
