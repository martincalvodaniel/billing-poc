"use client"

import { useEffect, useId, useRef, useState } from "react"
import Modal from "@/app/components/Modal"
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
  netAmount: string
  vatAmount: string
}

interface EventFormModalProps {
  mode: "create" | "edit"
  event?: Event
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: EventFormValues) => Promise<void>
  isSubmitting: boolean
  errorMessage?: string | null
}

function emptyValues(): EventFormValues {
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
    netAmount: "",
    vatAmount: "",
  }
}

function valuesFromEvent(event: Event): EventFormValues {
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
  v.netAmount = String(event.netAmount)
  v.vatAmount = String(event.vatAmount)
  return v
}

export default function EventFormModal({
  mode,
  event,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: EventFormModalProps) {
  const id = useId()
  const titleRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<EventFormValues>(() =>
    mode === "edit" && event ? valuesFromEvent(event) : emptyValues()
  )

  // Reset form whenever the modal opens or the event identity changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberate reset on open/identity change only
  useEffect(() => {
    if (!isOpen) return
    setValues(mode === "edit" && event ? valuesFromEvent(event) : emptyValues())
    // Focus the first input shortly after the modal mounts.
    const t = setTimeout(() => titleRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [isOpen, mode, event?._id])

  const canSubmit =
    values.title.trim().length > 0 &&
    values.netAmount.trim().length > 0 &&
    values.vatAmount.trim().length > 0 &&
    !isSubmitting

  const handleChange =
    (field: keyof EventFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    await onSubmit(values)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // ENTER submits when valid (textarea retains its native newline behavior).
    if (
      e.key === "Enter" &&
      !(e.target instanceof HTMLTextAreaElement) &&
      canSubmit
    ) {
      e.preventDefault()
      void handleSubmit(e)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Edit event" : "New event"}
      maxWidth="lg"
      closeOnEscape
      closeOnBackdropClick
    >
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-4"
      >
        {errorMessage && (
          <div
            className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </div>
        )}

        <Field id={`${id}-title`} label="Title" required>
          <input
            ref={titleRef}
            id={`${id}-title`}
            type="text"
            value={values.title}
            onChange={handleChange("title")}
            disabled={isSubmitting}
            required
            maxLength={200}
            className={inputClass}
          />
        </Field>

        <Field id={`${id}-description`} label="Description">
          <textarea
            id={`${id}-description`}
            value={values.description}
            onChange={handleChange("description")}
            disabled={isSubmitting}
            maxLength={2000}
            rows={2}
            className={inputClass}
          />
        </Field>

        <fieldset className="grid grid-cols-3 gap-3">
          <legend className="col-span-3 mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date (optional)
          </legend>
          <Field id={`${id}-year`} label="Year">
            <input
              id={`${id}-year`}
              type="number"
              min={1900}
              max={2999}
              value={values.year}
              onChange={handleChange("year")}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
          <Field id={`${id}-month`} label="Month">
            <input
              id={`${id}-month`}
              type="number"
              min={1}
              max={12}
              value={values.month}
              onChange={handleChange("month")}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
          <Field id={`${id}-day`} label="Day">
            <input
              id={`${id}-day`}
              type="number"
              min={1}
              max={31}
              value={values.day}
              onChange={handleChange("day")}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
        </fieldset>

        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="col-span-2 mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Time (optional)
          </legend>
          <Field id={`${id}-hour`} label="Hour">
            <input
              id={`${id}-hour`}
              type="number"
              min={0}
              max={23}
              value={values.hour}
              onChange={handleChange("hour")}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
          <Field id={`${id}-minute`} label="Minute">
            <input
              id={`${id}-minute`}
              type="number"
              min={0}
              max={59}
              value={values.minute}
              onChange={handleChange("minute")}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field id={`${id}-duration`} label="Duration (minutes)">
            <input
              id={`${id}-duration`}
              type="number"
              min={1}
              value={values.durationMinutes}
              onChange={handleChange("durationMinutes")}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
          <Field id={`${id}-max`} label="Max attendees">
            <input
              id={`${id}-max`}
              type="number"
              min={1}
              value={values.maxAttendees}
              onChange={handleChange("maxAttendees")}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field id={`${id}-net`} label="Net amount / seat" required>
            <input
              id={`${id}-net`}
              type="number"
              step="0.01"
              min={0}
              value={values.netAmount}
              onChange={handleChange("netAmount")}
              disabled={isSubmitting}
              required
              className={inputClass}
            />
          </Field>
          <Field id={`${id}-vat`} label="VAT amount / seat" required>
            <input
              id={`${id}-vat`}
              type="number"
              step="0.01"
              min={0}
              value={values.vatAmount}
              onChange={handleChange("vatAmount")}
              disabled={isSubmitting}
              required
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-900"
          >
            {isSubmitting
              ? "Saving…"
              : mode === "edit"
                ? "Save changes"
                : "Create event"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {children}
    </div>
  )
}
