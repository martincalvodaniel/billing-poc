import type { Event, EventAttendee } from "../entities/event"

export interface EventFilter {
  year?: number
  month?: number
}

export interface EventRepository {
  findAll(filter: EventFilter): Promise<Event[]>
  findById(id: string): Promise<Event | null>
  create(event: Omit<Event, "_id">): Promise<string>
  update(
    id: string,
    data: Partial<Omit<Event, "_id" | "attendees">>
  ): Promise<boolean>
  delete(id: string): Promise<boolean>
  addAttendee(eventId: string, attendee: EventAttendee): Promise<boolean>
  updateAttendee(
    eventId: string,
    clientId: string,
    patch: { seats?: number; paymentId?: string | null }
  ): Promise<boolean>
  removeAttendee(eventId: string, clientId: string): Promise<boolean>
}
