import { describe, expect, test } from "bun:test"
import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import type { Payment } from "@/lib/domain/entities/payment"
import type { PaymentRepository } from "@/lib/domain/ports/payment-repository"
import { recomputeAttendeePayment } from "./event-payment-service"

function makeEvent(overrides: Partial<Event> = {}): Event {
  const now = new Date("2026-05-14T00:00:00Z")
  return {
    _id: "ev1",
    title: "Workshop",
    description: undefined,
    year: 2026,
    month: 5,
    day: 14,
    hour: undefined,
    minute: undefined,
    date: "2026-05-14",
    durationMinutes: 60,
    maxAttendees: 10,
    netAmount: 50,
    vatAmount: 0,
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
        series: "Invoice",
        number: 42,
        generatedAt: new Date("2026-05-14T10:00:00Z"),
        blobUrl: "https://blob.example/inv.pdf",
        blobPathname: "invoices/inv.pdf",
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
      invoiceSeries: "Invoice",
      invoiceNumber: 42,
    })
    expect(updates).toHaveLength(0)
  })

  test("returns 'updated' and persists new amounts/concepts when no invoice", async () => {
    const payment = makePayment()
    const { repo, updates } = makeFakeRepo(payment)
    const result = await recomputeAttendeePayment(
      makeEvent({ netAmount: 50, vatAmount: 0, durationMinutes: 60 }),
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

  test("'updated' applies duration multiplier to per-line amount", async () => {
    // 50 € net per seat, 120 min duration, 1 seat → per-line = 50 * 2 = 100
    const payment = makePayment({ concepts: [] })
    const { repo, updates } = makeFakeRepo(payment)
    const result = await recomputeAttendeePayment(
      makeEvent({ netAmount: 50, vatAmount: 0, durationMinutes: 120 }),
      makeAttendee({ paymentId: "pay1" }),
      2,
      { payments: repo }
    )
    expect(result).toEqual({
      status: "updated",
      paymentId: "pay1",
      netAmount: 200,
      vatAmount: 0,
      total: 200,
    })
    expect(updates[0].data.concepts).toEqual([
      { name: "Workshop", amount: 100, quantity: 2 },
    ])
  })

  test("'updated' falls back to event title when concept name absent", async () => {
    const payment = makePayment({ concepts: [] })
    const { repo, updates } = makeFakeRepo(payment)
    await recomputeAttendeePayment(
      makeEvent({ title: "Yoga class" }),
      makeAttendee({ paymentId: "pay1" }),
      1,
      { payments: repo }
    )
    expect(updates[0].data.concepts?.[0].name).toBe("Yoga class")
  })

  test("'updated' uses '(no date)' suffix when event has no date", async () => {
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
    expect(updates[0].data.concepts?.[0].name).toBe("Workshop (no date)")
  })
})
