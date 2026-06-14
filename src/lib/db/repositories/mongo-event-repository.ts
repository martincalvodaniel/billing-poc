import "server-only"

import type { Event, EventAttendee } from "../../domain/entities/event"
import type {
  EventFilter,
  EventRepository,
} from "../../domain/ports/event-repository"
import { getDatabase } from "../client"
import type { MongoEvent } from "../types"
import {
  attendeeToMongo,
  buildEventListQuery,
  isValidObjectId,
  toDomain,
  toObjectId,
} from "./mongo-event-repository-helpers"
import { MongoUpdateBuilder, omitNullish } from "./mongo-utils"

export { buildEventListQuery } from "./mongo-event-repository-helpers"

export class MongoEventRepository implements EventRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoEvent>("events")
  }

  /**
   * findAll: matches events whose derived `date` falls in the requested
   * range, OR partially-dated events with missing or null `day`/`date`
   * (Mongo `field: null` matches both BSON null and absent fields).
   */
  async findAll(filter: EventFilter): Promise<Event[]> {
    const col = await this.collection()
    const query = buildEventListQuery(filter)

    const docs = await col
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray()

    return docs.map(toDomain)
  }

  async findById(id: string): Promise<Event | null> {
    if (!isValidObjectId(id)) return null
    const col = await this.collection()
    const doc = await col.findOne({ _id: toObjectId(id) })
    return doc ? toDomain(doc) : null
  }

  async create(event: Omit<Event, "_id">): Promise<string> {
    const col = await this.collection()
    const doc = omitNullish({
      title: event.title,
      tag: event.tag,
      year: event.year,
      month: event.month,
      day: event.day,
      dayOfWeek: event.dayOfWeek,
      excludedDates: event.excludedDates,
      hour: event.hour,
      minute: event.minute,
      date: event.date,
      durationMinutes: event.durationMinutes,
      maxAttendees: event.maxAttendees,
      pricePerSeat: event.pricePerSeat,
      vatRate: event.vatRate,
      attendees: (event.attendees ?? []).map(attendeeToMongo),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    })
    const result = await col.insertOne(doc as MongoEvent)
    return result.insertedId.toString()
  }

  /**
   * Updates an event's top-level fields. The `attendees` field is stripped
   * by the port signature and must NEVER be overwritten here — attendee
   * mutations go through addAttendee/updateAttendee/removeAttendee.
   *
   * The caller is responsible for computing the derived `date` via
   * `deriveEventDate` before invoking update.
   */
  async update(
    id: string,
    data: Partial<Omit<Event, "_id" | "attendees">>
  ): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const builder = new MongoUpdateBuilder().set("updatedAt", new Date())

    if (data.title !== undefined) builder.set("title", data.title)
    if (data.tag !== undefined) builder.setOrUnset("tag", data.tag)
    if (data.year !== undefined) builder.setOrUnset("year", data.year)
    if (data.month !== undefined) builder.setOrUnset("month", data.month)
    if (data.day !== undefined) builder.setOrUnset("day", data.day)
    if (data.dayOfWeek !== undefined) {
      builder.setOrUnset("dayOfWeek", data.dayOfWeek)
    }
    if (data.excludedDates !== undefined) {
      builder.setOrUnset("excludedDates", data.excludedDates)
    }
    if (data.hour !== undefined) builder.setOrUnset("hour", data.hour)
    if (data.minute !== undefined) builder.setOrUnset("minute", data.minute)
    if (data.date !== undefined) builder.setOrUnset("date", data.date)
    if (data.durationMinutes !== undefined) {
      builder.setOrUnset("durationMinutes", data.durationMinutes)
    }
    if (data.maxAttendees !== undefined) {
      builder.setOrUnset("maxAttendees", data.maxAttendees)
    }
    if (data.pricePerSeat !== undefined) {
      builder.set("pricePerSeat", data.pricePerSeat)
    }
    if (data.vatRate !== undefined) builder.set("vatRate", data.vatRate)

    const result = await col.updateOne({ _id: toObjectId(id) }, builder.build())
    return result.matchedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
  }

  /**
   * Conditional push: only inserts if no attendee with the same clientId
   * already exists. Returns true on insert, false otherwise (duplicate or
   * event not found). $addToSet cannot be used here because attendees are
   * objects with mutable fields (seats, paymentId), so $addToSet would
   * incorrectly compare the whole object.
   */
  async addAttendee(
    eventId: string,
    attendee: EventAttendee
  ): Promise<boolean> {
    if (!isValidObjectId(eventId)) return false
    if (!isValidObjectId(attendee.clientId)) return false
    const col = await this.collection()
    const clientObjectId = toObjectId(attendee.clientId)
    const result = await col.updateOne(
      {
        _id: toObjectId(eventId),
        "attendees.clientId": { $ne: clientObjectId },
      },
      {
        $push: { attendees: attendeeToMongo(attendee) },
        $set: { updatedAt: new Date() },
      }
    )
    return result.modifiedCount > 0
  }

  async updateAttendee(
    eventId: string,
    clientId: string,
    patch: { seats?: number; paymentId?: string | null }
  ): Promise<boolean> {
    if (!isValidObjectId(eventId)) return false
    if (!isValidObjectId(clientId)) return false
    const col = await this.collection()
    const builder = new MongoUpdateBuilder().set("updatedAt", new Date())

    if (patch.seats !== undefined) {
      builder.set("attendees.$.seats", patch.seats)
    }
    if (patch.paymentId !== undefined) {
      builder.setOrUnset(
        "attendees.$.paymentId",
        patch.paymentId ? toObjectId(patch.paymentId) : null
      )
    }

    const result = await col.updateOne(
      {
        _id: toObjectId(eventId),
        "attendees.clientId": toObjectId(clientId),
      },
      builder.build()
    )
    return result.matchedCount > 0
  }

  async removeAttendee(eventId: string, clientId: string): Promise<boolean> {
    if (!isValidObjectId(eventId)) return false
    if (!isValidObjectId(clientId)) return false
    const col = await this.collection()
    const result = await col.updateOne(
      { _id: toObjectId(eventId) },
      {
        $pull: { attendees: { clientId: toObjectId(clientId) } },
        $set: { updatedAt: new Date() },
      }
    )
    return result.modifiedCount > 0
  }
}
