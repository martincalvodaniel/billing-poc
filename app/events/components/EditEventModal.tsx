"use client"

import dynamic from "next/dynamic"
import { useCallback } from "react"
import type { Event } from "@/lib/domain/entities/event"
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
    <div className="pb-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Attendees
      </h3>
      <AttendeesPanel
        event={event}
        onActionSuccess={onAttendeeSuccess ?? (() => {})}
        onActionError={onAttendeeError ?? (() => {})}
      />
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
