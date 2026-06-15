/**
 * MongoDB persistence shapes.
 *
 * These types describe documents exactly as they are stored in Mongo — the
 * only difference from the domain entities in `src/lib/domain/entities/` is that
 * identity and foreign-key fields are raw `ObjectId`s instead of `string`s.
 * Every other field is reused from the domain entity (via `Omit`) so there is
 * a single source of truth for value types and the two shapes cannot drift.
 *
 * They are imported **only** by the repository adapters in
 * `src/lib/db/repositories/`, which convert at the boundary (`toDomain` on
 * read → string ids; `toObjectId` on write). A stray import of a `Mongo*` type
 * outside that folder is a hexagonal-boundary violation.
 */
import type { ObjectId } from "mongodb"
import type { Absence } from "@/lib/domain/entities/absence"
import type { Client } from "@/lib/domain/entities/client"
import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import type { InvoiceCounter } from "@/lib/domain/entities/invoice"
import type { Payment } from "@/lib/domain/entities/payment"
import type { PaymentTemplate } from "@/lib/domain/entities/payment-template"
import type { Product } from "@/lib/domain/entities/product"

export type MongoPayment = Omit<Payment, "_id" | "clientId"> & {
  _id?: ObjectId
  clientId?: ObjectId
}

export type MongoPaymentTemplate = Omit<PaymentTemplate, "_id"> & {
  _id?: ObjectId
}

export type MongoClient = Omit<Client, "_id"> & {
  _id?: ObjectId
}

export type MongoInvoiceCounter = Omit<InvoiceCounter, "_id"> & {
  _id?: ObjectId
}

export type MongoProduct = Omit<Product, "_id"> & {
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
