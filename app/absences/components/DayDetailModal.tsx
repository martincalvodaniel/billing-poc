"use client"

import { useEffect, useRef, useState } from "react"
import Modal from "@/app/components/Modal"
import Toast from "@/app/components/Toast"
import type {
  Absence,
  AbsenceType,
  PartOfDay,
} from "@/lib/domain/entities/absence"
import { formatDate } from "@/lib/formatters"
import {
  isConflictError,
  useCreateAbsence,
  useDeleteAbsence,
  useUpdateAbsence,
} from "@/lib/hooks/useAbsenceMutations"
import AbsenceForm from "./AbsenceForm"
import { extractAbsenceErrorMessage } from "./absencesUi"
import PartSection from "./day-modal/PartSection"

interface DayDetailModalProps {
  date: string
  records: Absence[]
  onClose: () => void
}

interface FormState {
  mode: "create" | "edit"
  target?: Absence
}

export default function DayDetailModal({
  date,
  records,
  onClose,
}: DayDetailModalProps) {
  const [formState, setFormState] = useState<FormState>({ mode: "create" })
  const [pendingDelete, setPendingDelete] = useState<Absence | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [formPartOfDay, setFormPartOfDay] = useState<PartOfDay>("morning")
  const [formType, setFormType] = useState<AbsenceType>("absence")
  const [shakeKey, setShakeKey] = useState<number>(0)
  const [formVisible, setFormVisible] = useState<boolean>(false)

  const formContainerRef = useRef<HTMLDivElement>(null)
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  // When the form becomes visible, scroll it into view and focus the
  // student-name input as a best-effort accessibility nicety.
  useEffect(() => {
    if (!formVisible) return
    const container = formContainerRef.current
    if (!container) return
    container.scrollIntoView({ behavior: "smooth", block: "nearest" })
    const input = container.querySelector<HTMLInputElement>(
      'input[name="studentName"]'
    )
    input?.focus()
  }, [formVisible])

  const { trigger: createAbsence, isMutating: isCreating } = useCreateAbsence()
  const { trigger: updateAbsence, isMutating: isUpdating } = useUpdateAbsence()
  const { trigger: deleteAbsence, isMutating: isDeleting } = useDeleteAbsence()

  const isSubmitting = isCreating || isUpdating

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleAddInPart = (part: PartOfDay, type: AbsenceType) => {
    lastTriggerRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null
    setFormError(null)
    setFormState({ mode: "create" })
    setFormPartOfDay(part)
    setFormType(type)
    setFormVisible(true)
  }

  const handleCancelForm = () => {
    setFormError(null)
    setFormState({ mode: "create" })
    setFormVisible(false)
    // Best-effort focus restoration: return focus to the trigger that
    // opened the form. If it's no longer in the DOM, fall back to the
    // first focusable + Add button inside the modal body.
    requestAnimationFrame(() => {
      const trigger = lastTriggerRef.current
      if (trigger?.isConnected) {
        trigger.focus()
        return
      }
      const fallback = document.querySelector<HTMLButtonElement>(
        'button[aria-label^="Add absence"]'
      )
      fallback?.focus()
    })
  }

  const handleSubmit = async (data: {
    type: Absence["type"]
    studentName: string
    date: string
    partOfDay: PartOfDay
    comment?: string
  }) => {
    setFormError(null)
    try {
      if (formState.mode === "edit" && formState.target?._id) {
        await updateAbsence({
          id: formState.target._id,
          type: data.type,
          studentName: data.studentName,
          date: data.date,
          partOfDay: data.partOfDay,
          comment: data.comment,
        })
        showToast("Absence updated successfully!")
        // iter12: hide the inline form on successful EDIT (mirrors Cancel UX).
        // Add success keeps the form open (iter7 behavior preserved below).
        handleCancelForm()
      } else {
        await createAbsence({
          type: data.type,
          studentName: data.studentName,
          date: data.date,
          partOfDay: data.partOfDay,
          comment: data.comment,
        })
        showToast("Absence saved successfully!")
      }
    } catch (err) {
      console.error(`Error saving absence: ${err}`)
      if (isConflictError(err)) {
        setShakeKey((k) => k + 1)
        setFormError(
          extractAbsenceErrorMessage(err) ||
            "A record already exists for this student in the selected part of the day."
        )
        return
      }
      setFormError(extractAbsenceErrorMessage(err))
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete?._id) return
    setDeleteError(null)
    try {
      await deleteAbsence({ id: pendingDelete._id })
      showToast("Absence deleted successfully!")
      if (formState.target?._id === pendingDelete._id) {
        setFormState({ mode: "create" })
      }
      setPendingDelete(null)
    } catch (err) {
      console.error(`Error deleting absence: ${err}`)
      setDeleteError(extractAbsenceErrorMessage(err))
    }
  }

  const morningRecords = records.filter((r) => r.partOfDay === "morning")
  const eveningRecords = records.filter((r) => r.partOfDay === "evening")

  const editingId =
    formState.mode === "edit" ? formState.target?._id : undefined

  const handleEdit = (record: Absence) => {
    lastTriggerRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null
    setFormError(null)
    setFormState({ mode: "edit", target: record })
    setFormPartOfDay(record.partOfDay)
    setFormType(record.type)
    setFormVisible(true)
  }

  const handleDelete = (record: Absence) => {
    setDeleteError(null)
    setPendingDelete(record)
  }

  return (
    <>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      <Modal
        isOpen
        onClose={onClose}
        title={formatDate(date)}
        maxWidth="lg"
        closeOnEscape
        closeOnBackdropClick
      >
        <div className="space-y-6">
          <PartSection
            part="morning"
            records={morningRecords}
            editingId={editingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={(type) => handleAddInPart("morning", type)}
          />

          <PartSection
            part="evening"
            records={eveningRecords}
            editingId={editingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={(type) => handleAddInPart("evening", type)}
          />

          {formVisible && (
            <div
              ref={formContainerRef}
              className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
            >
              <AbsenceForm
                key={
                  formState.mode === "edit"
                    ? `edit-${formState.target?._id}`
                    : `create-${formPartOfDay}-${formType}`
                }
                title={
                  formState.mode === "edit"
                    ? "Edit record"
                    : `Add new ${formType === "recovery" ? "Recovery" : "Absence"} for ${formPartOfDay === "evening" ? "Evening" : "Morning"}`
                }
                submitTooltip={
                  formState.mode === "edit" ? "Save changes" : "Add record"
                }
                initialDate={date}
                initialPartOfDay={formPartOfDay}
                initialType={formType}
                initial={
                  formState.mode === "edit" ? formState.target : undefined
                }
                hideTypeAndPartOfDay={formState.mode !== "edit"}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onCancel={handleCancelForm}
                errorMessage={formError}
                shakeKey={shakeKey}
              />
            </div>
          )}
        </div>
      </Modal>

      {pendingDelete && (
        <Modal
          isOpen
          onClose={() => {
            if (!isDeleting) setPendingDelete(null)
          }}
          title="Delete Record"
          maxWidth="sm"
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={isDeleting}
                className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {deleteError && (
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
                role="alert"
                aria-live="polite"
                aria-atomic="true"
              >
                {deleteError}
              </div>
            )}
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Are you sure you want to delete this {pendingDelete.type} for{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {pendingDelete.studentName}
              </span>{" "}
              on {formatDate(pendingDelete.date)}?
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}
