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
import { FetchError } from "@/lib/swr-fetcher"
import AbsenceForm from "./AbsenceForm"

interface DayDetailModalProps {
  date: string
  records: Absence[]
  onClose: () => void
}

interface FormState {
  mode: "create" | "edit"
  target?: Absence
}

const PART_LABEL: Record<PartOfDay, string> = {
  morning: "Morning",
  evening: "Evening",
}

function extractErrorMessage(err: unknown): string {
  if (
    err instanceof FetchError &&
    err.info &&
    typeof err.info === "object" &&
    "error" in err.info &&
    typeof (err.info as { error: unknown }).error === "string"
  ) {
    return (err.info as { error: string }).error
  }
  if (err instanceof Error) return err.message
  return "An error occurred"
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
        setFormState({ mode: "create" })
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
          extractErrorMessage(err) ||
            "A record already exists for this student in the selected part of the day."
        )
        return
      }
      setFormError(extractErrorMessage(err))
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
      setDeleteError(extractErrorMessage(err))
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
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {formState.mode === "edit"
                  ? "Edit record"
                  : `Add new ${formType === "recovery" ? "Recovery" : "Absence"} for ${formPartOfDay === "evening" ? "Evening" : "Morning"}`}
              </h3>
              <AbsenceForm
                key={
                  formState.mode === "edit"
                    ? `edit-${formState.target?._id}`
                    : `create-${formPartOfDay}-${formType}`
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
                submitLabel={formState.mode === "edit" ? "Save" : "Add"}
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

interface RecordSectionProps {
  title: string
  colorClass: string
  records: Absence[]
  editingId: string | undefined
  onEdit: (record: Absence) => void
  onDelete: (record: Absence) => void
  onAddNew: () => void
  addAriaLabel: string
}

function RecordSection({
  title,
  colorClass,
  records,
  editingId,
  onEdit,
  onDelete,
  onAddNew,
  addAriaLabel,
}: RecordSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <span
            aria-hidden="true"
            className={`inline-block h-2 w-2 rounded-full ${colorClass}`}
          />
          {title}
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            ({records.length})
          </span>
        </h4>
        <button
          type="button"
          onClick={onAddNew}
          aria-label={addAriaLabel}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
      {records.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">None.</p>
      ) : (
        <ul className="space-y-2">
          {records.map((record) => (
            <li
              key={record._id ?? `${record.studentName}-${record.date}`}
              className={`flex items-start gap-2 rounded-md border p-3 ${
                editingId && editingId === record._id
                  ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                  : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {record.studentName}
                </p>
                {record.comment && (
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 break-words">
                    {record.comment}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  aria-label={`Edit ${record.type} for ${record.studentName}`}
                  className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(record)}
                  aria-label={`Delete ${record.type} for ${record.studentName}`}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface PartSectionProps {
  part: PartOfDay
  records: Absence[]
  editingId: string | undefined
  onEdit: (record: Absence) => void
  onDelete: (record: Absence) => void
  onAddNew: (type: AbsenceType) => void
}

function PartSection({
  part,
  records,
  editingId,
  onEdit,
  onDelete,
  onAddNew,
}: PartSectionProps) {
  const label = PART_LABEL[part]
  const absences = records.filter((r) => r.type === "absence")
  const recoveries = records.filter((r) => r.type === "recovery")

  return (
    <section
      className="space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
      aria-labelledby={`day-part-${part}`}
    >
      <header className="flex items-center justify-between gap-2">
        <h3
          id={`day-part-${part}`}
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {label}
          <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            ({records.length})
          </span>
        </h3>
      </header>
      <RecordSection
        title="Absences"
        colorClass="bg-red-500"
        records={absences}
        editingId={editingId}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddNew={() => onAddNew("absence")}
        addAriaLabel={`Add absence in ${label}`}
      />
      <RecordSection
        title="Recoveries"
        colorClass="bg-green-500"
        records={recoveries}
        editingId={editingId}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddNew={() => onAddNew("recovery")}
        addAriaLabel={`Add recovery in ${label}`}
      />
    </section>
  )
}
