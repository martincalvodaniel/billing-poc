"use client"

import { useEffect, useId, useRef, useState } from "react"
import Modal from "@/app/components/Modal"
import NumberStepperInput from "@/app/components/NumberStepperInput"
import PartialDatePicker, {
  type PartialDateValue,
} from "@/app/components/PartialDatePicker"
import type { Event } from "@/lib/domain/entities/event"
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
  /**
   * Field-level defaults applied ONLY in create mode and ONLY to fields that
   * are empty after `emptyValues()`. Ignored in edit mode.
   */
  defaults?: Partial<EventFormValues>
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
  v.netAmount = String(event.netAmount)
  v.vatAmount = String(event.vatAmount)
  return v
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
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
}: EventFormModalProps) {
  const id = useId()
  const titleRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<EventFormValues>(() =>
    mode === "edit" && event
      ? valuesFromEvent(event)
      : applyDefaults(emptyValues(), defaults)
  )
  const [vatRate, setVatRate] = useState<string>("21")

  // Reset form whenever the modal opens or the event identity changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberate reset on open/identity change only
  useEffect(() => {
    if (!isOpen) return
    setValues(
      mode === "edit" && event
        ? valuesFromEvent(event)
        : applyDefaults(emptyValues(), defaults)
    )
    setVatRate("21")
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

  const recomputeVat = (nextNet: string, nextRate: string) => {
    const net = Number(nextNet)
    const rate = Number(nextRate)
    if (!Number.isFinite(net) || !Number.isFinite(rate)) return
    const vat = round2(net * (rate / 100))
    setValues((prev) => ({ ...prev, vatAmount: String(vat) }))
  }

  const handleNetChange = (next: string) => {
    setValues((prev) => ({ ...prev, netAmount: next }))
    if (next.trim().length > 0) {
      recomputeVat(next, vatRate)
    }
  }

  const handleVatRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextRate = e.target.value
    setVatRate(nextRate)
    if (values.netAmount.trim().length > 0) {
      recomputeVat(values.netAmount, nextRate)
    }
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
            <NumberStepperInput
              id={`${id}-duration`}
              value={values.durationMinutes}
              onChange={(next) =>
                setValues((prev) => ({ ...prev, durationMinutes: next }))
              }
              min={1}
              step={5}
              disabled={isSubmitting}
              suffix="min"
              ariaLabel="Duration in minutes"
            />
          </Field>
          <Field id={`${id}-max`} label="Max attendees">
            <NumberStepperInput
              id={`${id}-max`}
              value={values.maxAttendees}
              onChange={(next) =>
                setValues((prev) => ({ ...prev, maxAttendees: next }))
              }
              min={1}
              step={1}
              disabled={isSubmitting}
              ariaLabel="Max attendees"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Field id={`${id}-net`} label="Net amount / seat" required>
              <NumberStepperInput
                id={`${id}-net`}
                value={values.netAmount}
                onChange={handleNetChange}
                min={0}
                step={0.01}
                disabled={isSubmitting}
                required
                suffix="€"
                ariaLabel="Net amount per seat"
              />
            </Field>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Per seat. Multiplied by duration/60 when generating payments.
            </p>
          </div>
          <div className="space-y-1">
            <Field id={`${id}-vat`} label="VAT amount / seat" required>
              <NumberStepperInput
                id={`${id}-vat`}
                value={values.vatAmount}
                onChange={(next) =>
                  setValues((prev) => ({ ...prev, vatAmount: next }))
                }
                min={0}
                step={0.01}
                disabled={isSubmitting}
                required
                suffix="€"
                ariaLabel="VAT amount per seat"
              />
            </Field>
            <div className="flex items-center gap-2">
              <label
                htmlFor={`${id}-vat-rate`}
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                VAT rate
              </label>
              <input
                id={`${id}-vat-rate`}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={vatRate}
                onChange={handleVatRateChange}
                disabled={isSubmitting}
                className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                %
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Changing Net or VAT rate recomputes VAT as Net × rate/100.
            </p>
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
