"use client"

import { useEffect, useId, useRef, useState } from "react"
import Modal from "@/app/components/Modal"
import PartialDatePicker, {
  type PartialDateValue,
} from "@/app/components/PartialDatePicker"
import type { Event } from "@/lib/domain/entities/event"
import AttendeesPanel from "./AttendeesPanel"
import { formatTimeOfDay, parseTimeOfDay } from "./eventsUi"

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

interface EventFormModalProps {
  mode: "create" | "edit"
  event?: Event
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: EventFormValues) => Promise<void>
  isSubmitting: boolean
  errorMessage?: string | null
  /**
   * Field-level defaults applied ONLY in create mode and ONLY to fields that
   * are empty after `emptyValues()`. Ignored in edit mode.
   */
  defaults?: Partial<EventFormValues>
  onAttendeeSuccess?: (msg: string) => void
  onAttendeeError?: (msg: string) => void
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
    pricePerSeat: "",
    vatRate: "21",
  }
}

function applyDefaults(
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
  v.pricePerSeat = String(event.pricePerSeat)
  v.vatRate = String(event.vatRate)
  return v
}

function stringToOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

function partialDateFromValues(values: EventFormValues): PartialDateValue {
  return {
    year: stringToOptionalNumber(values.year),
    month: stringToOptionalNumber(values.month),
    day: stringToOptionalNumber(values.day),
  }
}

export default function EventFormModal({
  mode,
  event,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
  defaults,
  onAttendeeSuccess,
  onAttendeeError,
}: EventFormModalProps) {
  const id = useId()
  const titleRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<EventFormValues>(() =>
    mode === "edit" && event
      ? valuesFromEvent(event)
      : applyDefaults(emptyValues(), defaults)
  )

  // Reset form whenever the modal opens or the event identity changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberate reset on open/identity change only
  useEffect(() => {
    if (!isOpen) return
    setValues(
      mode === "edit" && event
        ? valuesFromEvent(event)
        : applyDefaults(emptyValues(), defaults)
    )
    const t = setTimeout(() => titleRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [isOpen, mode, event?._id])

  const canSubmit =
    values.title.trim().length > 0 &&
    values.pricePerSeat.trim().length > 0 &&
    values.vatRate.trim().length > 0 &&
    !isSubmitting

  const handleChange =
    (field: keyof EventFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value }))

  const handleDateChange = (next: PartialDateValue) => {
    setValues((prev) => ({
      ...prev,
      year: typeof next.year === "number" ? String(next.year) : "",
      month: typeof next.month === "number" ? String(next.month) : "",
      day: typeof next.day === "number" ? String(next.day) : "",
    }))
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseTimeOfDay(e.target.value)
    setValues((prev) => ({
      ...prev,
      hour: typeof parsed.hour === "number" ? String(parsed.hour) : "",
      minute: typeof parsed.minute === "number" ? String(parsed.minute) : "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    await onSubmit(values)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (
      e.key === "Enter" &&
      !(e.target instanceof HTMLTextAreaElement) &&
      canSubmit
    ) {
      e.preventDefault()
      void handleSubmit(e)
    }
  }

  const timeValue = formatTimeOfDay(
    stringToOptionalNumber(values.hour),
    stringToOptionalNumber(values.minute)
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Edit event" : "New event"}
      maxWidth={mode === "edit" ? "xl" : "lg"}
      closeOnEscape
      closeOnBackdropClick
    >
      {mode === "edit" && event?._id && (
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
      )}
      {/*
        `noValidate` disables the browser's native form validation popups
        (e.g. "the two nearest valid values are X and Y" when typing values
        that don't match the input's `step`). We still validate server-side
        via Zod schemas; `step` here is only a UX convenience for keyboard
        arrows / spinner increments.
      */}
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-4"
        noValidate
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

        <div className="space-y-1">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Date (optional)
          </span>
          <PartialDatePicker
            value={partialDateFromValues(values)}
            onChange={handleDateChange}
            disabled={isSubmitting}
            ariaLabelPrefix="Event date"
          />
        </div>

        <Field id={`${id}-time`} label="Time (optional)">
          <input
            id={`${id}-time`}
            type="time"
            step={60}
            value={timeValue}
            onChange={handleTimeChange}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id={`${id}-duration`} label="Duration (minutes)">
            <input
              id={`${id}-duration`}
              type="number"
              inputMode="numeric"
              min={30}
              step={30}
              value={values.durationMinutes}
              onChange={handleChange("durationMinutes")}
              disabled={isSubmitting}
              aria-label="Duration in minutes"
              className={inputClass}
            />
          </Field>
          <Field id={`${id}-max`} label="Max attendees">
            <input
              id={`${id}-max`}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={values.maxAttendees}
              onChange={handleChange("maxAttendees")}
              disabled={isSubmitting}
              aria-label="Max attendees"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Field id={`${id}-price`} label="Price per seat (gross)" required>
              <input
                id={`${id}-price`}
                type="number"
                inputMode="numeric"
                min={0}
                step={5}
                value={values.pricePerSeat}
                onChange={handleChange("pricePerSeat")}
                disabled={isSubmitting}
                required
                aria-label="Price per seat (gross)"
                className={inputClass}
              />
            </Field>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Price the attendee pays per seat (VAT included). Net and VAT are
              derived using the VAT rate.
            </p>
          </div>
          <div className="space-y-1">
            <Field id={`${id}-vat-rate`} label="VAT rate (%)" required>
              <input
                id={`${id}-vat-rate`}
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                value={values.vatRate}
                onChange={handleChange("vatRate")}
                disabled={isSubmitting}
                required
                aria-label="VAT rate percentage"
                className={inputClass}
              />
            </Field>
          </div>
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
