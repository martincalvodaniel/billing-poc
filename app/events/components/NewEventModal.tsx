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
  /**
   * Fully-populated initial values (e.g. when copying an existing event).
   * When provided, replaces the empty/defaults seed entirely.
   */
  seedValues?: EventFormValues | null
  /**
   * Identity that triggers a form reset when it changes (e.g. a new copy
   * source). Defaults to "create".
   */
  resetKey?: string
}

export default function NewEventModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
  defaults,
  seedValues,
  resetKey,
}: NewEventModalProps) {
  const computeInitialValues = useCallback(
    () =>
      seedValues ? { ...seedValues } : applyDefaults(emptyValues(), defaults),
    [defaults, seedValues]
  )

  return (
    <EventFormShell
      isOpen={isOpen}
      onClose={onClose}
      title="New event"
      submitLabel="Create event"
      maxWidth="lg"
      resetKey={resetKey ?? "create"}
      computeInitialValues={computeInitialValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  )
}
