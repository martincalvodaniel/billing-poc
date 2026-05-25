"use client"

import { useRef, useState } from "react"
import { Modal } from "@/app/components/Modal"
import Toast from "@/app/components/Toast"
import type {
  Absence,
  AbsenceFormData,
  AbsenceType,
  PartOfDay,
} from "@/lib/domain/entities/absence"
import { formatDate } from "@/lib/formatters"
import {
  AbsenceForm,
  DateField,
  FieldsRow,
  PartOfDayField,
  StudentNameField,
  TypeField,
} from "./AbsenceForm"
import PartSection from "./day-modal/PartSection"
import useAbsenceMutationHandlers from "./hooks/useAbsenceMutationHandlers"
import useInlineFormController from "./hooks/useInlineFormController"
import useToast from "./hooks/useToast"
import ConfirmDeleteModal from "./shared/ConfirmDeleteModal"

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
  const {
    message: toastMessage,
    show: showToast,
    clear: clearToast,
  } = useToast()
  const [formPartOfDay, setFormPartOfDay] = useState<PartOfDay>("morning")
  const [formType, setFormType] = useState<AbsenceType>("absence")

  const inlineForm = useInlineFormController()
  // Forward ref so `useAbsenceMutationHandlers` callbacks can reach
  // `handleCancelForm` defined below without a TDZ error.
  const handleCancelFormRef = useRef<() => void>(() => {})

  const mutations = useAbsenceMutationHandlers({
    onSuccess: showToast,
    onAfterEditSuccess: () => handleCancelFormRef.current(),
    onAfterAddSuccess: () => handleCancelFormRef.current(),
  })

  const { isSubmitting, isDeleting, formError, deleteError, shakeKey } =
    mutations

  const handleCancelForm = () => {
    mutations.clearFormError()
    setFormState({ mode: "create" })
    inlineForm.hide('button[aria-label^="Add absence"]')
  }
  handleCancelFormRef.current = handleCancelForm

  const handleAddInPart = (part: PartOfDay, type: AbsenceType) => {
    mutations.clearFormError()
    setFormState({ mode: "create" })
    setFormPartOfDay(part)
    setFormType(type)
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

  const morningRecords = records.filter((r) => r.partOfDay === "morning")
  const eveningRecords = records.filter((r) => r.partOfDay === "evening")

  const editingId =
    formState.mode === "edit" ? formState.target?._id : undefined

  const handleEdit = (record: Absence) => {
    mutations.clearFormError()
    setFormState({ mode: "edit", target: record })
    setFormPartOfDay(record.partOfDay)
    setFormType(record.type)
    inlineForm.show()
  }

  const handleDelete = (record: Absence) => {
    mutations.clearDeleteError()
    setPendingDelete(record)
  }

  return (
    <>
      {toastMessage && <Toast message={toastMessage} onClose={clearToast} />}

      <Modal isOpen onClose={onClose} title={formatDate(date)} maxWidth="lg">
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

          {inlineForm.visible && (
            <div
              ref={inlineForm.containerRef}
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
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onCancel={handleCancelForm}
                errorMessage={formError}
                shakeKey={shakeKey}
              >
                <FieldsRow>
                  <StudentNameField />
                  <DateField />
                </FieldsRow>
                {formState.mode === "edit" && (
                  <>
                    <TypeField />
                    <PartOfDayField />
                  </>
                )}
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
    </>
  )
}
