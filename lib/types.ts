/**
 * MongoDB persistence shapes.
 *
 * These types describe documents exactly as they are stored in Mongo — the
 * only difference from the domain entities in `lib/domain/entities/` is that
 * identity and foreign-key fields are raw `ObjectId`s instead of `string`s.
 * Every other field is reused from the domain entity (via `Omit`) so there is
 * a single source of truth for value types and the two shapes cannot drift.
 *
 * They are imported **only** by the repository adapters in
 * `lib/adapters/repositories/`, which convert at the boundary (`toDomain` on
 * read → string ids; `toObjectId` on write). A stray import of a `Mongo*` type
 * outside that folder is a hexagonal-boundary violation.
 */
import type { ObjectId } from "mongodb"
import type { Absence } from "./domain/entities/absence"
import type { Client } from "./domain/entities/client"
import type { Event, EventAttendee } from "./domain/entities/event"
import type { InvoiceCounter } from "./domain/entities/invoice"
import type { Payment } from "./domain/entities/payment"

export type MongoPayment = Omit<Payment, "_id" | "clientId"> & {
  _id?: ObjectId
  clientId?: ObjectId
}

export type MongoClient = Omit<Client, "_id"> & {
  _id?: ObjectId
}

export type MongoInvoiceCounter = Omit<InvoiceCounter, "_id"> & {
  _id?: ObjectId
}

/**
 * `studentNameLower` is a persistence-only denormalisation used for
 * accent-insensitive querying and the unique index; it has no place in the
 * domain entity.
 */
export type MongoAbsence = Omit<Absence, "_id"> & {
  _id?: ObjectId
  studentNameLower: string
}

export type MongoEventAttendee = Omit<
  EventAttendee,
  "clientId" | "paymentId"
> & {
  clientId: ObjectId
  paymentId?: ObjectId
}

export type MongoEvent = Omit<Event, "_id" | "attendees"> & {
  _id?: ObjectId
  attendees: MongoEventAttendee[]
}
