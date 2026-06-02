import type { Filter } from "mongodb"
import type { Event, EventAttendee } from "../../domain/entities/event"
import type { EventFilter } from "../../domain/ports/event-repository"
import type { MongoEvent, MongoEventAttendee } from "../../types"
import { isValidObjectId, toObjectId } from "./mongo-utils"

// Re-exported from the shared repository utils so existing event-repository
// imports keep working; the single source of truth lives in `./mongo-utils`.
export { isValidObjectId, toObjectId }

function attendeeToDomain(a: MongoEventAttendee): EventAttendee {
  return {
    clientId: a.clientId.toString(),
    seats: a.seats,
    paymentId: a.paymentId?.toString(),
    addedAt: a.addedAt,
  }
}

export function attendeeToMongo(a: EventAttendee): MongoEventAttendee {
  const doc: MongoEventAttendee = {
    clientId: toObjectId(a.clientId),
    seats: a.seats,
    addedAt: a.addedAt,
  }
  if (a.paymentId) doc.paymentId = toObjectId(a.paymentId)
  return doc
}

// Migration note: documents predating iteration 260514-1802 stored
// `netAmount` (per-seat NET euros) and `vatAmount` (per-seat absolute VAT
// euros). They now store `pricePerSeat` (gross euros/seat, VAT included)
// and `vatRate` (percentage). Legacy documents are NOT auto-migrated.
export function toDomain(doc: MongoEvent): Event {
  return {
    _id: doc._id?.toString(),
    title: doc.title,
    tag: doc.tag,
    year: doc.year,
    month: doc.month,
    day: doc.day,
    dayOfWeek: doc.dayOfWeek,
    excludedDates: doc.excludedDates,
    hour: doc.hour,
    minute: doc.minute,
    date: doc.date,
    durationMinutes: doc.durationMinutes,
    maxAttendees: doc.maxAttendees,
    pricePerSeat: doc.pricePerSeat,
    vatRate: doc.vatRate,
    attendees: (doc.attendees ?? []).map(attendeeToDomain),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0")
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function buildEventListQuery(filter: EventFilter): Filter<MongoEvent> {
  if (filter.year && filter.month) {
    const last = lastDayOfMonth(filter.year, filter.month)
    const start = `${filter.year}-${pad2(filter.month)}-01`
    const end = `${filter.year}-${pad2(filter.month)}-${pad2(last)}`
    // `day: null` matches both BSON null and missing field.
    const query: Record<string, unknown> = {
      $or: [
        { date: { $gte: start, $lte: end } },
        { year: filter.year, month: filter.month, day: null },
      ],
    }
    return query as Filter<MongoEvent>
  }
  if (filter.year) {
    const start = `${filter.year}-01-01`
    const end = `${filter.year}-12-31`
    const query: Record<string, unknown> = {
      $or: [
        { date: { $gte: start, $lte: end } },
        { year: filter.year, date: null },
      ],
    }
    return query as Filter<MongoEvent>
  }
  return {}
}
