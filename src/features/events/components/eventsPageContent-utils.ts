import type { AddEventAttendeeInput } from "@/features/events/hooks/useEventMutations"
import { FetchError } from "@/lib/client/swr-fetcher"
import type { Event } from "@/lib/domain/entities/event"
import { eventOccursOnRecurringDate } from "./calendar/calendarUtils"
import type { EventFormValues } from "./eventFormModal-utils"

export interface EventsFormState {
  open: boolean
  mode: "create" | "edit"
  event?: Event
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

function toRequiredNumber(value: string): number {
  const n = Number(value.trim())
  return Number.isFinite(n) ? n : 0
}

export function extractEventErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof FetchError) {
    const info = error.info as { error?: string } | null
    if (info && typeof info.error === "string") return info.error
    return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export function mapFormValuesToEventInput(values: EventFormValues) {
  return {
    title: values.title.trim(),
    tag: values.tag.trim() || undefined,
    year: toOptionalNumber(values.year),
    month: toOptionalNumber(values.month),
    day: toOptionalNumber(values.day),
    dayOfWeek: toOptionalNumber(values.dayOfWeek),
    hour: toOptionalNumber(values.hour),
    minute: toOptionalNumber(values.minute),
    durationMinutes: toOptionalNumber(values.durationMinutes),
    maxAttendees: toOptionalNumber(values.maxAttendees),
    pricePerSeat: toRequiredNumber(values.pricePerSeat),
    vatRate: toRequiredNumber(values.vatRate),
  }
}

export function filterDayEvents(
  events: Event[],
  dayModalKey: string | null
): Event[] {
  if (!dayModalKey) return []
  const [yStr, mStr, dStr] = dayModalKey.split("-")
  const date = new Date(Number(yStr), Number(mStr) - 1, Number(dStr))
  return events.filter(
    (e) =>
      e.date === dayModalKey || eventOccursOnRecurringDate(e, date, dayModalKey)
  )
}

export async function copyAttendeesToEvent(
  sourceEvent: Event,
  createdId: string,
  trigger: (args: AddEventAttendeeInput) => Promise<unknown>
): Promise<string> {
  if (
    sourceEvent.dayOfWeek === undefined ||
    sourceEvent.attendees.length === 0
  ) {
    return "Event created"
  }
  const results = await Promise.allSettled(
    sourceEvent.attendees.map((attendee) =>
      trigger({
        eventId: createdId,
        clientId: attendee.clientId,
        seats: attendee.seats,
      })
    )
  )
  const copied = results.filter((r) => r.status === "fulfilled").length
  const failed = results.length - copied
  return failed > 0
    ? `Event created. ${copied} attendees copied, ${failed} failed`
    : `Event created with ${copied} attendees copied`
}
