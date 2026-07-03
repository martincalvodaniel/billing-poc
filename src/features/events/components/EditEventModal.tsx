"use client"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { Event } from "@/lib/domain/entities/event"
import { formatDate } from "@/lib/utils/formatters"
import EventFormShell from "./EventFormShell"
import { type EventFormValues, valuesFromEvent } from "./eventFormModal-utils"

const AttendeesPanel = dynamic(
  () => {
    return import("./AttendeesPanel")
  },
  {
    ssr: false,
  }
)
interface EditEventModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: EventFormValues) => Promise<void>
  isSubmitting: boolean
  availableTags: string[]
  errorMessage?: string | null
  onAttendeeSuccess?: (msg: string) => void
  onAttendeeError?: (msg: string) => void
  onExcludedDatesChange?: (excludedDates: string[]) => void
}
function toIsoDate(year: number, month: number, day: number): string {
  const y = String(year)
  const m = String(month).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${y}-${m}-${d}`
}
function recurringMonthOccurrences(event: Event): string[] {
  if (
    event.year === undefined ||
    event.month === undefined ||
    event.dayOfWeek === undefined
  ) {
    return []
  }
  const daysInMonth = new Date(event.year, event.month, 0).getDate()
  const out: string[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(event.year, event.month - 1, day).getDay()
    if (weekday === event.dayOfWeek) {
      out.push(toIsoDate(event.year, event.month, day))
    }
  }
  return out
}
export default function EditEventModal({
  event,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  availableTags,
  errorMessage,
  onAttendeeSuccess,
  onAttendeeError,
  onExcludedDatesChange,
}: EditEventModalProps) {
  const computeInitialValues = useCallback(() => {
    return valuesFromEvent(event)
  }, [event])
  const [excludedDatesDraft, setExcludedDatesDraft] = useState<string[]>(
    event.excludedDates ?? []
  )
  useEffect(() => {
    setExcludedDatesDraft(event.excludedDates ?? [])
  }, [event.excludedDates])
  const occurrences = useMemo(() => {
    return recurringMonthOccurrences(event)
  }, [event])
  const toggleOccurrence = (date: string) => {
    setExcludedDatesDraft((prev) => {
      const next = prev.includes(date)
        ? prev.filter((value) => {
            return value !== date
          })
        : [...prev, date].sort((a, b) => {
            return a.localeCompare(b)
          })
      onExcludedDatesChange?.(next)
      return next
    })
  }
  const attendeesPanel = event._id ? (
    <div className="space-y-4 pb-4">
      {event.dayOfWeek !== undefined && occurrences.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-900/20">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            This month occurrences
          </h3>
          <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300">
            Toggle each occurrence: green is active, red is excluded.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {occurrences.map((date) => (
              <OccurrenceToggle
                key={date}
                date={date}
                excluded={excludedDatesDraft.includes(date)}
                onToggle={toggleOccurrence}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Attendees
        </h3>
        <AttendeesPanel
          event={event}
          onActionSuccess={onAttendeeSuccess ?? (() => {})}
          onActionError={onAttendeeError ?? (() => {})}
        />
      </div>
    </div>
  ) : null
  return (
    <EventFormShell
      isOpen={isOpen}
      onClose={onClose}
      title="Edit event"
      submitLabel="Save changes"
      maxWidth="xl"
      resetKey={event._id ?? "edit"}
      computeInitialValues={computeInitialValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      availableTags={availableTags}
      errorMessage={errorMessage}
      headerSlot={attendeesPanel}
    />
  )
}

function OccurrenceToggle({
  date,
  excluded,
  onToggle,
}: {
  date: string
  excluded: boolean
  onToggle: (date: string) => void
}) {
  const handleClick = useStableCallback(() => onToggle(date))
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-full border px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        excluded
          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
          : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
      }`}
    >
      {formatDate(date)}
    </button>
  )
}
