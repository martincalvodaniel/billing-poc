"use client"

import { useMemo, useState } from "react"
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
import {
  extractAbsenceErrorMessage,
  PART_OF_DAY_LABEL,
  TYPE_DOT_CLASS,
  TYPE_LABEL,
} from "./absencesUi"
import { TrashIcon } from "./icons"
import RecordRowActions from "./RecordRowActions"

interface StudentDetailModalProps {
  studentName: string
  records: Absence[]
  onClose: () => void
}

interface FormState {
  mode: "create" | "edit"
  target?: Absence
}

const PART_OF_DAY_ORDER: PartOfDay[] = ["morning", "evening"]
const TYPE_ORDER: AbsenceType[] = ["absence", "recovery"]

export default function StudentDetailModal({
  studentName,
  records,
  onClose,
}: StudentDetailModalProps) {
  const [formState, setFormState] = useState<FormState>({ mode: "create" })
  const [pendingDelete, setPendingDelete] = useState<Absence | null>(null)
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)
  const [deleteAllError, setDeleteAllError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { trigger: createAbsence, isMutating: isCreating } = useCreateAbsence()
  const { trigger: updateAbsence, isMutating: isUpdating } = useUpdateAbsence()
  const { trigger: deleteAbsence, isMutating: isDeleting } = useDeleteAbsence()

  const isSubmitting = isCreating || isUpdating

  const absenceCount = useMemo(
    () => records.filter((r) => r.type === "absence").length,
    [records]
  )
  const recoveryCount = useMemo(
    () => records.filter((r) => r.type === "recovery").length,
    [records]
  )

  // Group records by date desc → partOfDay (Morning, Evening) → type (Absence, Recovery)
  const groupedRecords = useMemo(() => {
    const byDate = new Map<string, Absence[]>()
    for (const r of records) {
      const list = byDate.get(r.date)
      if (list) list.push(r)
      else byDate.set(r.date, [r])
    }
    const dates = Array.from(byDate.keys()).sort((a, b) =>
      a < b ? 1 : a > b ? -1 : 0
    )
    return dates.map((date) => {
      const dayRecords = byDate.get(date) ?? []
      const parts = PART_OF_DAY_ORDER.map((part) => {
        const partRecords = dayRecords.filter((r) => r.partOfDay === part)
        const types = TYPE_ORDER.map((t) => ({
          type: t,
          items: partRecords.filter((r) => r.type === t),
        })).filter((g) => g.items.length > 0)
        return { partOfDay: part, types }
      }).filter((p) => p.types.length > 0)
      return { date, parts }
    })
  }, [records])

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 4000)
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
      setFormError(extractAbsenceErrorMessage(err))
      if (isConflictError(err)) {
        setShakeKey((k) => k + 1)
      }
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

  const handleConfirmDeleteAll = async () => {
    setDeleteAllError(null)
    try {
      const result = await deleteAbsence({ studentName })
      showToast(`Deleted ${result.deletedCount} records`)
      setDeleteAllConfirmOpen(false)
      onClose()
    } catch (err) {
      console.error(`Error deleting all records: ${err}`)
      setDeleteAllError(extractAbsenceErrorMessage(err))
    }
  }

  return (
    <>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      <Modal
        isOpen
        onClose={onClose}
        title={studentName}
        maxWidth="lg"
        closeOnEscape
        closeOnBackdropClick
      >
        <div className="space-y-6">
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Records
                <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  ({records.length})
                </span>
              </h3>
              {records.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteAllError(null)
                    setDeleteAllConfirmOpen(true)
                  }}
                  aria-label={`Delete all records for ${studentName}`}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                >
                  <TrashIcon />
                  Delete all
                </button>
              )}
            </div>
            {groupedRecords.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No records yet.
              </p>
            ) : (
              <div className="space-y-4">
                {groupedRecords.map((dateGroup) => (
                  <div key={dateGroup.date} className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                      {formatDate(dateGroup.date)}
                    </h4>
                    <div className="space-y-3 pl-2">
                      {dateGroup.parts.map((partGroup) => (
                        <div
                          key={`${dateGroup.date}-${partGroup.partOfDay}`}
                          className="space-y-2"
                        >
                          <h5 className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {PART_OF_DAY_LABEL[partGroup.partOfDay]}
                          </h5>
                          {partGroup.types.map((typeGroup) => (
                            <div
                              key={`${dateGroup.date}-${partGroup.partOfDay}-${typeGroup.type}`}
                              className="space-y-1"
                            >
                              <h6 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                                {TYPE_LABEL[typeGroup.type]}
                              </h6>
                              <ul className="space-y-2">
                                {typeGroup.items.map((record) => (
                                  <li
                                    key={
                                      record._id ??
                                      `${record.date}-${record.partOfDay}-${record.type}`
                                    }
                                    className={`flex items-start gap-2 rounded-md border p-3 ${
                                      formState.mode === "edit" &&
                                      formState.target?._id === record._id
                                        ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
                                          <span
                                            aria-hidden="true"
                                            className={`inline-block h-2 w-2 rounded-full ${TYPE_DOT_CLASS[record.type]}`}
                                          />
                                          {TYPE_LABEL[record.type]}
                                        </span>
                                      </div>
                                      {record.comment && (
                                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 break-words">
                                          {record.comment}
                                        </p>
                                      )}
                                    </div>
                                    <RecordRowActions
                                      onEdit={() => {
                                        setFormError(null)
                                        setFormState({
                                          mode: "edit",
                                          target: record,
                                        })
                                      }}
                                      onDelete={() => {
                                        setDeleteError(null)
                                        setPendingDelete(record)
                                      }}
                                      editLabel={`Edit ${record.type} on ${formatDate(record.date)}`}
                                      deleteLabel={`Delete ${record.type} on ${formatDate(record.date)}`}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <AbsenceForm
              key={
                formState.mode === "edit"
                  ? `edit-${formState.target?._id}`
                  : "create"
              }
              title={formState.mode === "edit" ? "Edit record" : "Add record"}
              submitTooltip={
                formState.mode === "edit" ? "Save changes" : "Add record"
              }
              initialStudentName={studentName}
              initial={formState.mode === "edit" ? formState.target : undefined}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={
                formState.mode === "edit"
                  ? () => {
                      setFormError(null)
                      setFormState({ mode: "create" })
                    }
                  : undefined
              }
              errorMessage={formError}
              shakeKey={shakeKey}
            />
          </div>
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

      {deleteAllConfirmOpen && (
        <Modal
          isOpen
          onClose={() => {
            if (!isDeleting) setDeleteAllConfirmOpen(false)
          }}
          title="Delete all records?"
          maxWidth="sm"
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteAllConfirmOpen(false)}
                disabled={isDeleting}
                className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                disabled={isDeleting}
                className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {deleteAllError && (
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
                role="alert"
                aria-live="polite"
                aria-atomic="true"
              >
                {deleteAllError}
              </div>
            )}
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Delete {records.length} records ({absenceCount} absences,{" "}
              {recoveryCount} recoveries) for{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                &quot;{studentName}&quot;
              </span>
              ? This cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}
