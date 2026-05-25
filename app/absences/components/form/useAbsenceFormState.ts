"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type {
  Absence,
  AbsenceFormData,
  AbsenceType,
  PartOfDay,
} from "@/lib/domain/entities/absence"

interface UseAbsenceFormStateOptions {
  initial?: Absence
  initialDate?: string
  initialStudentName?: string
  initialPartOfDay?: PartOfDay
  initialType?: AbsenceType
  onSubmit: (data: AbsenceFormData) => Promise<void>
  isSubmitting: boolean
}

interface UseAbsenceFormStateResult {
  studentName: string
  setStudentName: (v: string) => void
  date: string
  setDate: (v: string) => void
  type: AbsenceType
  setType: (v: AbsenceType) => void
  partOfDay: PartOfDay
  setPartOfDay: (v: PartOfDay) => void
  canSubmit: boolean
  formRef: React.RefObject<HTMLFormElement | null>
  studentNameRef: React.RefObject<HTMLInputElement | null>
  handleSubmit: (e: React.FormEvent) => Promise<void>
  handleKeyDown: (e: React.KeyboardEvent<HTMLFormElement>) => void
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Owns the local form state for `<AbsenceForm>`:
 * - Seeds initial values from `initial` (edit) or the create-mode props.
 * - Resets state when `initial` / `initialPartOfDay` / `initialType` change.
 * - Trims and validates input on submit, then dispatches.
 * - iter7 sticky-fields-after-add: in create mode (no `initial`) and only
 *   when `hideStudentName === false`, clears `studentName` after a
 *   successful submit and re-focuses the input via `requestAnimationFrame`.
 * - iter6 Cmd/Ctrl+Enter shortcut: prevents default + stops propagation
 *   and triggers `formRef.requestSubmit()`.
 *
 * Behavior preserved verbatim from the inline implementation in
 * `AbsenceForm.tsx`.
 */
export default function useAbsenceFormState(
  opts: UseAbsenceFormStateOptions
): UseAbsenceFormStateResult {
  const {
    initial,
    initialDate,
    initialStudentName,
    initialPartOfDay,
    initialType,
    onSubmit,
    isSubmitting,
  } = opts

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
    const data: AbsenceFormData = {
      type,
      studentName: trimmedName,
      date,
      partOfDay,
    }
    await onSubmit(data)
    if (!initial && !initialStudentName) {
      // Create mode WITHOUT a seeded student (e.g., DayDetailModal):
      // clear ONLY the student name so the user can quickly add another
      // record for a different student. Date, type and partOfDay
      // stay sticky. If `onSubmit` throws (validation/conflict), this block
      // is skipped and the user's input is preserved. When `initialStudentName`
      // is provided (per-student context), the student is implicit and must
      // remain seeded — skip the reset+focus.
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

  return {
    studentName,
    setStudentName,
    date,
    setDate,
    type,
    setType,
    partOfDay,
    setPartOfDay,
    canSubmit,
    formRef,
    studentNameRef,
    handleSubmit,
    handleKeyDown,
  }
}
