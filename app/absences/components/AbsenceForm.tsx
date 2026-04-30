"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import type {
  Absence,
  AbsenceFormData,
  AbsenceType,
} from "@/lib/domain/entities/absence"
import { useAbsenceStudents } from "@/lib/hooks/useAbsenceStudents"
import { useClients } from "@/lib/hooks/useClients"

const COMMENT_MAX = 500

interface AbsenceFormProps {
  initialDate?: string
  initialStudentName?: string
  initial?: Absence
  onSubmit: (data: AbsenceFormData) => Promise<void>
  isSubmitting: boolean
  submitLabel?: string
  onCancel?: () => void
  cancelLabel?: string
  errorMessage?: string | null
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Case-insensitive dedupe; preserves first-seen casing; sorts alphabetically.
 */
export function mergeStudentNameOptions(
  absenceNames: readonly string[],
  clientNames: readonly string[]
): string[] {
  const seen = new Map<string, string>()
  for (const name of [...absenceNames, ...clientNames]) {
    const trimmed = name.trim()
    if (trimmed === "") continue
    const key = trimmed.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, trimmed)
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  )
}

export default function AbsenceForm({
  initialDate,
  initialStudentName,
  initial,
  onSubmit,
  isSubmitting,
  submitLabel = "Add",
  onCancel,
  cancelLabel = "Cancel",
  errorMessage,
}: AbsenceFormProps) {
  const id = useId()
  const datalistId = `${id}-students`

  const [studentName, setStudentName] = useState<string>(
    initial?.studentName ?? initialStudentName ?? ""
  )
  const [date, setDate] = useState<string>(
    initial?.date ?? initialDate ?? todayISO()
  )
  const [type, setType] = useState<AbsenceType>(initial?.type ?? "absence")
  const [comment, setComment] = useState<string>(initial?.comment ?? "")

  const formRef = useRef<HTMLFormElement>(null)

  // Reset state if `initial` changes (e.g., switching from create→edit).
  useEffect(() => {
    if (initial) {
      setStudentName(initial.studentName)
      setDate(initial.date)
      setType(initial.type)
      setComment(initial.comment ?? "")
    }
  }, [initial])

  const { students: absenceStudents } = useAbsenceStudents(studentName)
  const { clients } = useClients({ pageSize: 1000 })
  const clientNames = clients.map((c) => c.name)
  const options = mergeStudentNameOptions(absenceStudents, clientNames)

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
      comment: trimmedComment === "" ? undefined : trimmedComment,
    }
    await onSubmit(data)
    if (!initial) {
      // Create mode: clear comment but keep sticky student/date/type.
      setComment("")
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

      {/* Comment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`${id}-comment`}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Comment (Optional)
          </label>
          <span
            className="text-xs text-zinc-500 dark:text-zinc-400"
            aria-live="polite"
          >
            {comment.length}/{COMMENT_MAX}
          </span>
        </div>
        <textarea
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
  )
}
