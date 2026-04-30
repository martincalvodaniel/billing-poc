"use client"

import { useId } from "react"
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
import useAbsenceFormState from "./form/useAbsenceFormState"

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
  /**
   * When true, hide the student-name autocomplete input. The underlying
   * `studentName` state is still seeded from `initialStudentName` and
   * submitted as-is. Use this in contexts where the student is already
   * implicit (e.g., a per-student modal). Defaults to `false`.
   */
  hideStudentName?: boolean
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
  hideStudentName = false,
}: AbsenceFormProps) {
  const id = useId()
  const datalistId = `${id}-students`

  const {
    studentName,
    setStudentName,
    date,
    setDate,
    type,
    setType,
    partOfDay,
    setPartOfDay,
    comment,
    setComment,
    canSubmit,
    formRef,
    studentNameRef,
    handleSubmit,
    handleKeyDown,
  } = useAbsenceFormState({
    initial,
    initialDate,
    initialStudentName,
    initialPartOfDay,
    initialType,
    hideStudentName,
    onSubmit,
    isSubmitting,
  })

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

        <div
          className={
            hideStudentName ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"
          }
        >
          {!hideStudentName && (
            <StudentNameAutocomplete
              id={`${id}-studentName`}
              datalistId={datalistId}
              value={studentName}
              onChange={setStudentName}
              disabled={isSubmitting}
              inputRef={studentNameRef}
            />
          )}

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
