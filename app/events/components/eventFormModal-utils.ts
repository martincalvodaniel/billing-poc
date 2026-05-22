import type { PartialDateValue } from "@/app/components/PartialDatePicker"
import type { Event } from "@/lib/domain/entities/event"

export interface EventFormValues {
  title: string
  description: string
  year: string
  month: string
  day: string
  hour: string
  minute: string
  durationMinutes: string
  maxAttendees: string
  pricePerSeat: string
  vatRate: string
}

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"

export function emptyValues(): EventFormValues {
  return {
    title: "",
    description: "",
    year: "",
    month: "",
    day: "",
    hour: "",
    minute: "",
    durationMinutes: "",
    maxAttendees: "",
    pricePerSeat: "",
    vatRate: "21",
  }
}

export function applyDefaults(
  base: EventFormValues,
  defaults: Partial<EventFormValues> | undefined
): EventFormValues {
  if (!defaults) return base
  const merged: EventFormValues = { ...base }
  for (const key of Object.keys(defaults) as Array<keyof EventFormValues>) {
    const incoming = defaults[key]
    if (typeof incoming !== "string") continue
    if (merged[key].length > 0) continue
    merged[key] = incoming
  }
  return merged
}

export function valuesFromEvent(event: Event): EventFormValues {
  const v = emptyValues()
  v.title = event.title
  v.description = event.description ?? ""
  v.year = event.year !== undefined ? String(event.year) : ""
  v.month = event.month !== undefined ? String(event.month) : ""
  v.day = event.day !== undefined ? String(event.day) : ""
  v.hour = event.hour !== undefined ? String(event.hour) : ""
  v.minute = event.minute !== undefined ? String(event.minute) : ""
  v.durationMinutes =
    event.durationMinutes !== undefined ? String(event.durationMinutes) : ""
  v.maxAttendees =
    event.maxAttendees !== undefined ? String(event.maxAttendees) : ""
  v.pricePerSeat = String(event.pricePerSeat)
  v.vatRate = String(event.vatRate)
  return v
}

export function stringToOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

export function partialDateFromValues(
  values: EventFormValues
): PartialDateValue {
  return {
    year: stringToOptionalNumber(values.year),
    month: stringToOptionalNumber(values.month),
    day: stringToOptionalNumber(values.day),
  }
}
