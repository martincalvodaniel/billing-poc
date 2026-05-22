"use client"

import { useMemo, useRef, useState } from "react"
import { Modal } from "@/app/components/Modal"
import Toast from "@/app/components/Toast"
import type { Absence, AbsenceFormData } from "@/lib/domain/entities/absence"
import { formatDate } from "@/lib/formatters"
import {
  AbsenceForm,
  CommentField,
  DateField,
  FieldsRow,
  PartOfDayField,
  TypeField,
} from "./AbsenceForm"
import useAbsenceMutationHandlers from "./hooks/useAbsenceMutationHandlers"
import useInlineFormController from "./hooks/useInlineFormController"
import useToast from "./hooks/useToast"
import { TrashIcon } from "./icons"
import AddRecordButton from "./shared/AddRecordButton"
import ConfirmDeleteModal from "./shared/ConfirmDeleteModal"
import { groupStudentRecords } from "./student-modal/groupStudentRecords"
import StudentRecordsList from "./student-modal/StudentRecordsList"

interface StudentDetailModalProps {
  studentName: string
  records: Absence[]
  onClose: () => void
}

interface FormState {
  mode: "create" | "edit"
  target?: Absence
}

export default function StudentDetailModal({
  studentName,
  records,
  onClose,
}: StudentDetailModalProps) {
  const [formState, setFormState] = useState<FormState>({ mode: "create" })
  const [pendingDelete, setPendingDelete] = useState<Absence | null>(null)
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)
  const {
    message: toastMessage,
    show: showToast,
    clear: clearToast,
  } = useToast()

  // iter14: inline form is hidden by default; revealed via the new
  // `+` button next to "Records (N)" or via the row-pencil edit
  // action. Owns visibility, focus capture, and focus-restore.
  const inlineForm = useInlineFormController()
  // Forward ref so `useAbsenceMutationHandlers` callbacks can reach
  // `handleCloseEditForm` defined below without a TDZ error.
  const handleCloseEditFormRef = useRef<() => void>(() => {})

  const absenceCount = useMemo(
    () => records.filter((r) => r.type === "absence").length,
    [records]
  )
  const recoveryCount = useMemo(
    () => records.filter((r) => r.type === "recovery").length,
    [records]
  )

  // Group records by date desc → partOfDay (Morning, Evening) → type (Absence, Recovery)
  const groupedRecords = useMemo(() => groupStudentRecords(records), [records])

  const mutations = useAbsenceMutationHandlers({
    onSuccess: showToast,
    onAfterEditSuccess: () => handleCloseEditFormRef.current(),
    onAfterAddSuccess: () => handleCloseEditFormRef.current(),
    onAfterDeleteAll: () => {
      setDeleteAllConfirmOpen(false)
      onClose()
    },
  })

  const {
    isSubmitting,
    isDeleting,
    formError,
    deleteError,
    deleteAllError,
    shakeKey,
  } = mutations

  const handleCloseEditForm = () => {
    mutations.clearFormError()
    setFormState({ mode: "create" })
    inlineForm.hide('button[aria-label^="Add record for"]')
  }
  handleCloseEditFormRef.current = handleCloseEditForm

  const handleAddNew = () => {
    mutations.clearFormError()
    setFormState({ mode: "create" })
    inlineForm.show()
  }

  const handleSubmit = (data: AbsenceFormData) =>
    mutations.submit(
      data,
      formState.mode === "edit" ? formState.target : undefined
    )

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    const ok = await mutations.deleteOne(pendingDelete)
    if (!ok) return
    if (formState.target?._id === pendingDelete._id) {
      setFormState({ mode: "create" })
    }
    setPendingDelete(null)
  }

  const handleConfirmDeleteAll = () =>
    mutations.deleteAllForStudent(studentName)

  return (
    <>
      {toastMessage && <Toast message={toastMessage} onClose={clearToast} />}

      <Modal isOpen onClose={onClose} title={studentName} maxWidth="lg">
        <div className="space-y-6">
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Records
                <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  ({records.length})
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <AddRecordButton
                  onClick={handleAddNew}
                  ariaLabel={`Add record for ${studentName}`}
                  title={`Add record for ${studentName}`}
                />
                {records.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      mutations.clearDeleteAllError()
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
            </div>
            {groupedRecords.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No records yet.
              </p>
            ) : (
              <StudentRecordsList
                groups={groupedRecords}
                editingId={
                  formState.mode === "edit" ? formState.target?._id : undefined
                }
                onEdit={(record) => {
                  mutations.clearFormError()
                  setFormState({ mode: "edit", target: record })
                  inlineForm.show()
                }}
                onDelete={(record) => {
                  mutations.clearDeleteError()
                  setPendingDelete(record)
                }}
              />
            )}
          </section>

          {inlineForm.visible && (
            <div
              ref={inlineForm.containerRef}
              className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
            >
              <AbsenceForm
                key={
                  formState.mode === "edit"
                    ? `edit-${formState.target?._id}`
                    : "create"
                }
                title={
                  formState.mode === "edit"
                    ? `Edit record for ${studentName}`
                    : `Add record for ${studentName}`
                }
                submitTooltip={
                  formState.mode === "edit" ? "Save changes" : "Add record"
                }
                initialStudentName={studentName}
                initial={
                  formState.mode === "edit" ? formState.target : undefined
                }
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onCancel={handleCloseEditForm}
                errorMessage={formError}
                shakeKey={shakeKey}
              >
                <FieldsRow columns={1}>
                  <DateField />
                </FieldsRow>
                <TypeField />
                <PartOfDayField />
                <CommentField />
              </AbsenceForm>
            </div>
          )}
        </div>
      </Modal>

      {pendingDelete && (
        <ConfirmDeleteModal
          isOpen
          title="Delete Record"
          isPending={isDeleting}
          errorMessage={deleteError}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleConfirmDelete}
        >
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
        </ConfirmDeleteModal>
      )}

      {deleteAllConfirmOpen && (
        <ConfirmDeleteModal
          isOpen
          title="Delete all records?"
          isPending={isDeleting}
          errorMessage={deleteAllError}
          onCancel={() => setDeleteAllConfirmOpen(false)}
          onConfirm={handleConfirmDeleteAll}
        >
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Delete {records.length} records ({absenceCount} absences,{" "}
            {recoveryCount} recoveries) for{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &quot;{studentName}&quot;
            </span>
            ? This cannot be undone.
          </p>
        </ConfirmDeleteModal>
      )}
    </>
  )
}
