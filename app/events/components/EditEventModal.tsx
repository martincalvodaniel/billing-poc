"use client"

import dynamic from "next/dynamic"
import { useCallback } from "react"
import type { Event } from "@/lib/domain/entities/event"
import { formatDate } from "@/lib/formatters"
import EventFormShell from "./EventFormShell"
import { type EventFormValues, valuesFromEvent } from "./eventFormModal-utils"

const AttendeesPanel = dynamic(() => import("./AttendeesPanel"), {
  ssr: false,
})

interface EditEventModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: EventFormValues) => Promise<void>
  isSubmitting: boolean
  errorMessage?: string | null
  onAttendeeSuccess?: (msg: string) => void
  onAttendeeError?: (msg: string) => void
}

export default function EditEventModal({
  event,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
  onAttendeeSuccess,
  onAttendeeError,
}: EditEventModalProps) {
  const computeInitialValues = useCallback(
    () => valuesFromEvent(event),
    [event]
  )

  const attendeesPanel = event._id ? (
    <div className="space-y-4 pb-4">
      {event.dayOfWeek !== undefined &&
        (event.excludedDates?.length ?? 0) > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-900/20">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Excluded dates
            </h3>
            <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300">
              This recurring event will skip these dates.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(event.excludedDates ?? []).map((date) => (
                <span
                  key={date}
                  className="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  {formatDate(date)}
                </span>
              ))}
            </div>
          </div>
        )}

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
      errorMessage={errorMessage}
      headerSlot={attendeesPanel}
    />
  )
}
