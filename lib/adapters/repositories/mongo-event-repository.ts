import { ObjectId } from "mongodb"
import type { Event, EventAttendee } from "../../domain/entities/event"
import type {
  EventFilter,
  EventRepository,
} from "../../domain/ports/event-repository"
import { getDatabase } from "../../mongodb"
import type {
  Event as MongoEvent,
  EventAttendee as MongoEventAttendee,
} from "../../types"

function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id)
}

function attendeeToDomain(a: MongoEventAttendee): EventAttendee {
  return {
    clientId: a.clientId.toString(),
    seats: a.seats,
    paymentId: a.paymentId?.toString(),
    addedAt: a.addedAt,
  }
}

function attendeeToMongo(a: EventAttendee): MongoEventAttendee {
  return {
    clientId: toObjectId(a.clientId),
    seats: a.seats,
    paymentId: a.paymentId ? toObjectId(a.paymentId) : undefined,
    addedAt: a.addedAt,
  }
}

// Migration note: documents predating iteration 260514-1802 stored
// `netAmount` (per-seat NET euros) and `vatAmount` (per-seat absolute VAT
// euros). They now store `pricePerSeat` (gross euros/seat, VAT included)
// and `vatRate` (percentage). Legacy documents are NOT auto-migrated; see
// the iteration plan §3.4 for the one-off Mongo shell update.
function toDomain(doc: MongoEvent): Event {
  return {
    _id: doc._id?.toString(),
    title: doc.title,
    description: doc.description,
    year: doc.year,
    month: doc.month,
    day: doc.day,
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

export class MongoEventRepository implements EventRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoEvent>("events")
  }

  /**
   * findAll query strategy:
   * - (year, month): match events whose stored derived `date` falls within
   *   that month. We also OR-include partially-dated events (those that
   *   have `year` and `month` set but no `day`, so no derived `date`) so the
   *   list view surfaces them. The calendar UI re-filters on `date`.
   * - (year only): match events whose stored `date` falls within that year,
   *   OR events whose `year` field equals it (covers undated-by-day events
   *   that still belong to that year and events with only `year` set).
   * - (no filter): return all events.
   */
  async findAll(filter: EventFilter): Promise<Event[]> {
    const col = await this.collection()
    let query: Record<string, unknown> = {}

    if (filter.year && filter.month) {
      const last = lastDayOfMonth(filter.year, filter.month)
      const start = `${filter.year}-${pad2(filter.month)}-01`
      const end = `${filter.year}-${pad2(filter.month)}-${pad2(last)}`
      query = {
        $or: [
          { date: { $gte: start, $lte: end } },
          { year: filter.year, month: filter.month, day: { $exists: false } },
        ],
      }
    } else if (filter.year) {
      const start = `${filter.year}-01-01`
      const end = `${filter.year}-12-31`
      query = {
        $or: [
          { date: { $gte: start, $lte: end } },
          { year: filter.year, date: { $exists: false } },
        ],
      }
    }

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
    const doc: Omit<MongoEvent, "_id"> = {
      title: event.title,
      description: event.description,
      year: event.year,
      month: event.month,
      day: event.day,
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
    }
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
    const setData: Record<string, unknown> = {
      updatedAt: new Date(),
    }
    const unsetData: Record<string, ""> = {}

    const setOrUnset = (
      key: string,
      value: unknown,
      treatEmptyStringAsUnset = false
    ) => {
      if (value === undefined) return
      if (value === null) {
        unsetData[key] = ""
      } else if (treatEmptyStringAsUnset && value === "") {
        unsetData[key] = ""
      } else {
        setData[key] = value
      }
    }

    if (data.title !== undefined) setData.title = data.title
    setOrUnset("description", data.description, true)
    setOrUnset("year", data.year)
    setOrUnset("month", data.month)
    setOrUnset("day", data.day)
    setOrUnset("hour", data.hour)
    setOrUnset("minute", data.minute)
    setOrUnset("date", data.date)
    setOrUnset("durationMinutes", data.durationMinutes)
    setOrUnset("maxAttendees", data.maxAttendees)
    if (data.pricePerSeat !== undefined)
      setData.pricePerSeat = data.pricePerSeat
    if (data.vatRate !== undefined) setData.vatRate = data.vatRate

    const updateOps: Record<string, unknown> = { $set: setData }
    if (Object.keys(unsetData).length > 0) {
      updateOps.$unset = unsetData
    }

    const result = await col.updateOne({ _id: toObjectId(id) }, updateOps)
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
    patch: Partial<Pick<EventAttendee, "seats" | "paymentId">>
  ): Promise<boolean> {
    if (!isValidObjectId(eventId)) return false
    if (!isValidObjectId(clientId)) return false
    const col = await this.collection()
    const setData: Record<string, unknown> = { updatedAt: new Date() }

    if (patch.seats !== undefined) {
      setData["attendees.$.seats"] = patch.seats
    }
    if (patch.paymentId !== undefined) {
      setData["attendees.$.paymentId"] = toObjectId(patch.paymentId)
    }

    const result = await col.updateOne(
      {
        _id: toObjectId(eventId),
        "attendees.clientId": toObjectId(clientId),
      },
      { $set: setData }
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
