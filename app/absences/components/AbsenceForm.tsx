"use client"

import { createContext, use, useId } from "react"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import type {
  Absence,
  AbsenceFormData,
  AbsenceType,
  PartOfDay,
} from "@/lib/domain/entities/absence"
import { useStableCallback } from "@/lib/hooks/useStableCallback"
import FormHeader from "./form/FormHeader"
import RadioPillGroup from "./form/RadioPillGroup"
import StudentNameAutocomplete from "./form/StudentNameAutocomplete"
import useAbsenceFormState from "./form/useAbsenceFormState"

type AbsenceFormState = ReturnType<typeof useAbsenceFormState>

interface AbsenceFormContextValue {
  state: AbsenceFormState
  idPrefix: string
  datalistId: string
  isSubmitting: boolean
}

const AbsenceFormContext = createContext<AbsenceFormContextValue | null>(null)

function useAbsenceFormContext(): AbsenceFormContextValue {
  const ctx = use(AbsenceFormContext)
  if (!ctx) {
    throw new Error(
      "AbsenceForm.* subcomponents must be rendered inside <AbsenceForm>"
    )
  }
  return ctx
}

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
   * Composed form body. Use `<AbsenceForm.StudentNameField>`,
   * `<AbsenceForm.DateField>`, `<AbsenceForm.TypeField>`,
   * `<AbsenceForm.PartOfDayField>` and
   * `<AbsenceForm.FieldsRow>` to compose the layout.
   */
  children: React.ReactNode
}

export function AbsenceForm({
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
  children,
}: AbsenceFormProps) {
  const idPrefix = useId()
  const datalistId = `${idPrefix}-students`

  const state = useAbsenceFormState({
    initial,
    initialDate,
    initialStudentName,
    initialPartOfDay,
    initialType,
    onSubmit,
    isSubmitting,
  })

  const ctx: AbsenceFormContextValue = {
    state,
    idPrefix,
    datalistId,
    isSubmitting,
  }

  return (
    <div key={shakeKey} className={shakeKey ? "animate-shake" : ""}>
      <form
        ref={state.formRef}
        onSubmit={state.handleSubmit}
        onKeyDown={state.handleKeyDown}
        className="space-y-4"
      >
        <FormHeader
          title={title}
          submitTooltip={submitTooltip}
          isSubmitting={isSubmitting}
          canSubmit={state.canSubmit}
          onCancel={onCancel}
        />

        {errorMessage ? <ErrorBanner>{errorMessage}</ErrorBanner> : null}

        <AbsenceFormContext value={ctx}>{children}</AbsenceFormContext>
      </form>
    </div>
  )
}

export function FieldsRow({
  columns = 2,
  children,
}: {
  columns?: 1 | 2
  children: React.ReactNode
}) {
  const cls = columns === 2 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"
  return <div className={cls}>{children}</div>
}

export function StudentNameField() {
  const { idPrefix, datalistId, state, isSubmitting } = useAbsenceFormContext()
  return (
    <StudentNameAutocomplete
      id={`${idPrefix}-studentName`}
      datalistId={datalistId}
      value={state.studentName}
      onChange={state.setStudentName}
      disabled={isSubmitting}
      inputRef={state.studentNameRef}
    />
  )
}

export function DateField() {
  const { idPrefix, state, isSubmitting } = useAbsenceFormContext()
  const handleChange = useStableCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      state.setDate(e.target.value)
    }
  )
  return (
    <div className="space-y-2">
      <label
        htmlFor={`${idPrefix}-date`}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Date
      </label>
      <input
        type="date"
        id={`${idPrefix}-date`}
        name="date"
        value={state.date}
        onChange={handleChange}
        disabled={isSubmitting}
        required
        className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </div>
  )
}

export function TypeField() {
  const { idPrefix, state, isSubmitting } = useAbsenceFormContext()
  return (
    <RadioPillGroup<AbsenceType>
      legend="Type"
      name={`${idPrefix}-type`}
      idPrefix={`${idPrefix}-type`}
      value={state.type}
      onChange={state.setType}
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
  )
}

export function PartOfDayField() {
  const { idPrefix, state, isSubmitting } = useAbsenceFormContext()
  return (
    <RadioPillGroup<PartOfDay>
      legend="Part of day"
      name={`${idPrefix}-partOfDay`}
      idPrefix={`${idPrefix}-partOfDay`}
      value={state.partOfDay}
      onChange={state.setPartOfDay}
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
  )
}
