"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import type {
  Absence,
  AbsenceFormData,
  AbsenceType,
  PartOfDay,
} from "@/lib/domain/entities/absence"
import CommentField from "./form/CommentField"
import FormHeader from "./form/FormHeader"
import RadioPillGroup from "./form/RadioPillGroup"
import StudentNameAutocomplete from "./form/StudentNameAutocomplete"

const COMMENT_MAX = 500

interface AbsenceFormProps {
  title: string
  submitTooltip: string
  initialDate?: string
  initialStudentName?: string
  initialPartOfDay?: PartOfDay
  initialType?: AbsenceType
  initial?: Absence
  onSubmit: (data: AbsenceFormData) => Promise<void>
  isSubmitting: boolean
  onCancel?: () => void
  errorMessage?: string | null
  shakeKey?: number
  /**
   * When true, hide the Type (Absence/Recovery) and Part-of-day
   * (Morning/Evening) radio groups. The values are still controlled
   * via `initialType` / `initialPartOfDay` and submitted normally.
   * Defaults to `false`.
   */
  hideTypeAndPartOfDay?: boolean
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function AbsenceForm({
  title,
  submitTooltip,
  initialDate,
  initialStudentName,
  initialPartOfDay,
  initialType,
  initial,
  onSubmit,
  isSubmitting,
  onCancel,
  errorMessage,
  shakeKey,
  hideTypeAndPartOfDay = false,
}: AbsenceFormProps) {
  const id = useId()
  const datalistId = `${id}-students`

  const [studentName, setStudentName] = useState<string>(
    initial?.studentName ?? initialStudentName ?? ""
  )
  const [date, setDate] = useState<string>(
    initial?.date ?? initialDate ?? todayISO()
  )
  const [type, setType] = useState<AbsenceType>(
    initial?.type ?? initialType ?? "absence"
  )
  const [partOfDay, setPartOfDay] = useState<PartOfDay>(
    initial?.partOfDay ?? initialPartOfDay ?? "morning"
  )
  const [comment, setComment] = useState<string>(initial?.comment ?? "")

  const formRef = useRef<HTMLFormElement>(null)
  const studentNameRef = useRef<HTMLInputElement>(null)

  // Reset state if `initial` changes (e.g., switching from create→edit),
  // or if the create-mode initial part/type props change (e.g., user clicks
  // a different "Add new" affordance).
  useEffect(() => {
    if (initial) {
      setStudentName(initial.studentName)
      setDate(initial.date)
      setType(initial.type)
      setPartOfDay(initial.partOfDay)
      setComment(initial.comment ?? "")
      return
    }
    if (initialPartOfDay) setPartOfDay(initialPartOfDay)
    if (initialType) setType(initialType)
  }, [initial, initialPartOfDay, initialType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    const trimmedName = studentName.trim()
    if (trimmedName === "" || date === "") return
    const trimmedComment = comment.trim()
    const data: AbsenceFormData = {
      type,
      studentName: trimmedName,
      date,
      partOfDay,
      // Always include `comment`. Sending an empty string allows the
      // backend to clear a previously saved comment on update; sending
      // `undefined` would cause the adapter to skip the `$set` and the
      // old value would be preserved.
      comment: trimmedComment,
    }
    await onSubmit(data)
    if (!initial) {
      // Create mode: clear ONLY the student name so the user can quickly
      // add another record for a different student. Date, type, partOfDay
      // and comment stay sticky. If `onSubmit` throws (validation/conflict),
      // this block is skipped and the user's input is preserved.
      setStudentName("")
      requestAnimationFrame(() => {
        studentNameRef.current?.focus()
      })
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        formRef.current?.requestSubmit()
      }
    },
    []
  )

  const canSubmit = studentName.trim() !== "" && date !== ""

  return (
    <div key={shakeKey} className={shakeKey ? "animate-shake" : ""}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-4"
      >
        <FormHeader
          title={title}
          submitTooltip={submitTooltip}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          onCancel={onCancel}
        />

        {errorMessage && (
          <div
            className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorMessage}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <StudentNameAutocomplete
            id={`${id}-studentName`}
            datalistId={datalistId}
            value={studentName}
            onChange={setStudentName}
            disabled={isSubmitting}
            inputRef={studentNameRef}
          />

          <div className="space-y-2">
            <label
              htmlFor={`${id}-date`}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Date
            </label>
            <input
              type="date"
              id={`${id}-date`}
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        {!hideTypeAndPartOfDay && (
          <RadioPillGroup<AbsenceType>
            legend="Type"
            name={`${id}-type`}
            idPrefix={`${id}-type`}
            value={type}
            onChange={setType}
            disabled={isSubmitting}
            options={[
              {
                value: "absence",
                label: "Absence",
                dotClass: "bg-red-500",
                ringClass: "text-red-600 focus:ring-2 focus:ring-red-500",
              },
              {
                value: "recovery",
                label: "Recovery",
                dotClass: "bg-green-500",
                ringClass: "text-green-600 focus:ring-2 focus:ring-green-500",
              },
            ]}
          />
        )}

        {!hideTypeAndPartOfDay && (
          <RadioPillGroup<PartOfDay>
            legend="Part of day"
            name={`${id}-partOfDay`}
            idPrefix={`${id}-partOfDay`}
            value={partOfDay}
            onChange={setPartOfDay}
            disabled={isSubmitting}
            required
            options={[
              {
                value: "morning",
                label: "Morning",
                ringClass: "text-blue-600 focus:ring-2 focus:ring-blue-500",
              },
              {
                value: "evening",
                label: "Evening",
                ringClass: "text-blue-600 focus:ring-2 focus:ring-blue-500",
              },
            ]}
          />
        )}

        <CommentField
          id={`${id}-comment`}
          value={comment}
          onChange={setComment}
          disabled={isSubmitting}
          max={COMMENT_MAX}
        />
      </form>
    </div>
  )
}
