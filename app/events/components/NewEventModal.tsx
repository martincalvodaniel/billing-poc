"use client"

import { useCallback } from "react"
import EventFormShell from "./EventFormShell"
import {
  applyDefaults,
  type EventFormValues,
  emptyValues,
} from "./eventFormModal-utils"

interface NewEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: EventFormValues) => Promise<void>
  isSubmitting: boolean
  errorMessage?: string | null
  /**
   * Field-level defaults applied ONLY to fields that are empty after
   * `emptyValues()`.
   */
  defaults?: Partial<EventFormValues>
}

export default function NewEventModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
  defaults,
}: NewEventModalProps) {
  const computeInitialValues = useCallback(
    () => applyDefaults(emptyValues(), defaults),
    [defaults]
  )

  return (
    <EventFormShell
      isOpen={isOpen}
      onClose={onClose}
      title="New event"
      submitLabel="Create event"
      maxWidth="lg"
      resetKey="create"
      computeInitialValues={computeInitialValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  )
}
