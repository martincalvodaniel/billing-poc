"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import type {
  Absence,
  AbsenceFormData,
  AbsenceType,
  PartOfDay,
} from "@/lib/domain/entities/absence"
import { useAbsenceStudents } from "@/lib/hooks/useAbsenceStudents"

const COMMENT_MAX = 500

interface AbsenceFormProps {
  initialDate?: string
  initialStudentName?: string
  initialPartOfDay?: PartOfDay
  initialType?: AbsenceType
  initial?: Absence
  onSubmit: (data: AbsenceFormData) => Promise<void>
  isSubmitting: boolean
  submitLabel?: string
  onCancel?: () => void
  cancelLabel?: string
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
  initialDate,
  initialStudentName,
  initialPartOfDay,
  initialType,
  initial,
  onSubmit,
  isSubmitting,
  submitLabel = "Add",
  onCancel,
  cancelLabel = "Cancel",
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
  const commentRef = useRef<HTMLTextAreaElement>(null)
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

  const { students: options } = useAbsenceStudents(studentName)

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

  return (
    <div key={shakeKey} className={shakeKey ? "animate-shake" : ""}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-4"
      >
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
          {/* Student name with datalist autocomplete */}
          <div className="space-y-2">
            <label
              htmlFor={`${id}-studentName`}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Student name
            </label>
            <input
              type="text"
              id={`${id}-studentName`}
              name="studentName"
              list={datalistId}
              ref={studentNameRef}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              disabled={isSubmitting}
              required
              autoComplete="off"
              placeholder="Type to search…"
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <datalist id={datalistId}>
              {options.map((name) => (
                <option key={name.toLowerCase()} value={name} />
              ))}
            </datalist>
          </div>

          {/* Date */}
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

        {/* Type radio group */}
        {!hideTypeAndPartOfDay && (
          <fieldset className="space-y-2" disabled={isSubmitting}>
            <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Type
            </legend>
            <div className="flex gap-4">
              <label
                htmlFor={`${id}-type-absence`}
                className="inline-flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <input
                  type="radio"
                  id={`${id}-type-absence`}
                  name={`${id}-type`}
                  value="absence"
                  checked={type === "absence"}
                  onChange={() => setType("absence")}
                  className="h-4 w-4 border-zinc-300 text-red-600 focus:ring-2 focus:ring-red-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full bg-red-500"
                  />
                  Absence
                </span>
              </label>
              <label
                htmlFor={`${id}-type-recovery`}
                className="inline-flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <input
                  type="radio"
                  id={`${id}-type-recovery`}
                  name={`${id}-type`}
                  value="recovery"
                  checked={type === "recovery"}
                  onChange={() => setType("recovery")}
                  className="h-4 w-4 border-zinc-300 text-green-600 focus:ring-2 focus:ring-green-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full bg-green-500"
                  />
                  Recovery
                </span>
              </label>
            </div>
          </fieldset>
        )}

        {/* Part of day radio group */}
        {!hideTypeAndPartOfDay && (
          <fieldset className="space-y-2" disabled={isSubmitting}>
            <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Part of day
            </legend>
            <div className="flex gap-4">
              <label
                htmlFor={`${id}-partOfDay-morning`}
                className="inline-flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <input
                  type="radio"
                  id={`${id}-partOfDay-morning`}
                  name={`${id}-partOfDay`}
                  value="morning"
                  checked={partOfDay === "morning"}
                  onChange={() => setPartOfDay("morning")}
                  required
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span>Morning</span>
              </label>
              <label
                htmlFor={`${id}-partOfDay-evening`}
                className="inline-flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <input
                  type="radio"
                  id={`${id}-partOfDay-evening`}
                  name={`${id}-partOfDay`}
                  value="evening"
                  checked={partOfDay === "evening"}
                  onChange={() => setPartOfDay("evening")}
                  required
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span>Evening</span>
              </label>
            </div>
          </fieldset>
        )}

        {/* Comment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label
                htmlFor={`${id}-comment`}
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Comment (Optional)
              </label>
              {comment.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setComment("")
                    commentRef.current?.focus()
                  }}
                  disabled={isSubmitting}
                  aria-label="Clear comment"
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-rose-600 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 dark:text-rose-400 dark:hover:text-rose-300"
                >
                  <span aria-hidden="true" className="text-xs leading-none">
                    ✕
                  </span>
                </button>
              )}
            </div>
            <span
              className="text-xs text-zinc-500 dark:text-zinc-400"
              aria-live="polite"
            >
              {comment.length}/{COMMENT_MAX}
            </span>
          </div>
          <textarea
            ref={commentRef}
            id={`${id}-comment`}
            name="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
            disabled={isSubmitting}
            rows={2}
            maxLength={COMMENT_MAX}
            placeholder="Add a note…"
            className="w-full resize-y rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 rounded bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || studentName.trim() === "" || date === ""}
            className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {isSubmitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
