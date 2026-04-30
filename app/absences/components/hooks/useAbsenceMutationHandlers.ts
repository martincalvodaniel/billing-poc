"use client"

import { useCallback, useState } from "react"
import type { Absence, AbsenceFormData } from "@/lib/domain/entities/absence"
import {
  isConflictError,
  useCreateAbsence,
  useDeleteAbsence,
  useUpdateAbsence,
} from "@/lib/hooks/useAbsenceMutations"
import { extractAbsenceErrorMessage } from "../absencesUi"

interface UseAbsenceMutationHandlersOptions {
  /** Called with a user-facing message after a successful mutation. */
  onSuccess: (message: string) => void
  /**
   * Called after a successful EDIT submit (iter12 hide-form-on-edit-success).
   * Add success deliberately does NOT trigger this callback.
   */
  onAfterEditSuccess?: () => void
  /** Called after a successful delete-all for a student. */
  onAfterDeleteAll?: () => void
}

interface UseAbsenceMutationHandlersResult {
  isSubmitting: boolean
  isDeleting: boolean
  formError: string | null
  deleteError: string | null
  deleteAllError: string | null
  shakeKey: number
  clearFormError: () => void
  clearDeleteError: () => void
  clearDeleteAllError: () => void
  /**
   * Submit a create-or-update.
   * - When `editTarget` is provided AND has an `_id`, performs an update.
   * - Otherwise performs a create.
   * Conflict (409) errors set a form error AND bump the shake key (one
   * consistent ordering: setFormError → setShakeKey → early return).
   */
  submit: (data: AbsenceFormData, editTarget?: Absence) => Promise<void>
  /** Delete a single record. Resolves to `true` on success. */
  deleteOne: (record: Absence) => Promise<boolean>
  /** Delete all records for a student. Resolves to `true` on success. */
  deleteAllForStudent: (studentName: string) => Promise<boolean>
}

/**
 * Centralized mutation + error wiring for `DayDetailModal` and
 * `StudentDetailModal`. Behavior matches iter1-12 verbatim with one
 * deliberate consolidation:
 *
 * **409-ordering decision (iter13):** on conflict errors we now do
 * `setFormError(...); setShakeKey(k => k + 1); return;` — this describes
 * the failure first and triggers the visual shake immediately after.
 * Previously `DayDetailModal` did shake → error and `StudentDetailModal`
 * did error → shake. React 19 batches both updates so the visual outcome
 * is identical; this picks the order that reads more naturally.
 */
export default function useAbsenceMutationHandlers(
  opts: UseAbsenceMutationHandlersOptions
): UseAbsenceMutationHandlersResult {
  const { onSuccess, onAfterEditSuccess, onAfterDeleteAll } = opts

  const { trigger: createAbsence, isMutating: isCreating } = useCreateAbsence()
  const { trigger: updateAbsence, isMutating: isUpdating } = useUpdateAbsence()
  const { trigger: deleteAbsence, isMutating: isDeleting } = useDeleteAbsence()

  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteAllError, setDeleteAllError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState<number>(0)

  const isSubmitting = isCreating || isUpdating

  const clearFormError = useCallback(() => setFormError(null), [])
  const clearDeleteError = useCallback(() => setDeleteError(null), [])
  const clearDeleteAllError = useCallback(() => setDeleteAllError(null), [])

  const submit = useCallback(
    async (data: AbsenceFormData, editTarget?: Absence) => {
      setFormError(null)
      try {
        if (editTarget?._id) {
          await updateAbsence({
            id: editTarget._id,
            type: data.type,
            studentName: data.studentName,
            date: data.date,
            partOfDay: data.partOfDay,
            comment: data.comment,
          })
          onSuccess("Absence updated successfully!")
          // iter12: hide the inline form on successful EDIT (mirrors Cancel
          // UX). Add success keeps the form open.
          onAfterEditSuccess?.()
        } else {
          await createAbsence({
            type: data.type,
            studentName: data.studentName,
            date: data.date,
            partOfDay: data.partOfDay,
            comment: data.comment,
          })
          onSuccess("Absence saved successfully!")
        }
      } catch (err) {
        console.error(`Error saving absence: ${err}`)
        if (isConflictError(err)) {
          setFormError(
            extractAbsenceErrorMessage(err) ||
              "A record already exists for this student in the selected part of the day."
          )
          setShakeKey((k) => k + 1)
          return
        }
        setFormError(extractAbsenceErrorMessage(err))
      }
    },
    [createAbsence, updateAbsence, onSuccess, onAfterEditSuccess]
  )

  const deleteOne = useCallback(
    async (record: Absence) => {
      if (!record._id) return false
      setDeleteError(null)
      try {
        await deleteAbsence({ id: record._id })
        onSuccess("Absence deleted successfully!")
        return true
      } catch (err) {
        console.error(`Error deleting absence: ${err}`)
        setDeleteError(extractAbsenceErrorMessage(err))
        return false
      }
    },
    [deleteAbsence, onSuccess]
  )

  const deleteAllForStudent = useCallback(
    async (studentName: string) => {
      setDeleteAllError(null)
      try {
        const result = await deleteAbsence({ studentName })
        onSuccess(`Deleted ${result.deletedCount} records`)
        onAfterDeleteAll?.()
        return true
      } catch (err) {
        console.error(`Error deleting all records: ${err}`)
        setDeleteAllError(extractAbsenceErrorMessage(err))
        return false
      }
    },
    [deleteAbsence, onSuccess, onAfterDeleteAll]
  )

  return {
    isSubmitting,
    isDeleting,
    formError,
    deleteError,
    deleteAllError,
    shakeKey,
    clearFormError,
    clearDeleteError,
    clearDeleteAllError,
    submit,
    deleteOne,
    deleteAllForStudent,
  }
}
