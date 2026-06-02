"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ConfirmDialog } from "@/app/components/ConfirmDialog"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import { IconButton } from "@/app/components/IconButton"
import { TrashIcon } from "@/app/components/icons/TrashIcon"
import { Modal } from "@/app/components/Modal"
import { formatEventDateTime } from "@/app/events/components/eventsUi"
import type { Payment, PaymentFormData } from "@/lib/domain/entities/payment"
import { useEventByPayment } from "@/lib/hooks/useEventByPayment"
import PaymentDetailFormFields from "./PaymentDetailFormFields"
import PaymentInvoicesSection from "./PaymentInvoicesSection"
import {
  buildDuplicateSeed,
  buildEditFormData,
} from "./paymentDetailModal-seed"
import { usePaymentDetailSave } from "./usePaymentDetailSave"
import { usePaymentForm } from "./usePaymentForm"

interface PaymentDetailModalProps {
  payment: Payment
  mode?: "edit" | "duplicate"
  onClose: () => void
  onUpdate?: (payment: Payment) => void
  onCreate?: (payment: { id: string }) => void
  onDelete?: (paymentId: string) => void
}

export default function PaymentDetailModal({
  payment,
  mode = "edit",
  onClose,
  onUpdate,
  onCreate,
  onDelete,
}: PaymentDetailModalProps) {
  const router = useRouter()
  const isDuplicate = mode === "duplicate"
  const paymentId = payment._id ?? null
  const { event: linkedEvent } = useEventByPayment(paymentId)
  const initialFormData: PaymentFormData = isDuplicate
    ? buildDuplicateSeed(payment)
    : buildEditFormData(payment)

  const {
    formData,
    suggestedTags,
    showTagSuggestions,
    handleChange,
    handleTagSelect,
    handleTagBlur,
    handleClientChange,
    addConcept,
    removeConcept,
    calculateTotal,
    calculateVatAmount,
    calculateSurchargeAmount,
    calculateNetAmount,
    calculateDiscount,
  } = usePaymentForm(initialFormData)

  const [showAdditionalFields, setShowAdditionalFields] = useState(false)

  const {
    error,
    isSaving,
    isCreating,
    isUpdating,
    isDeleting,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteError,
    setDeleteError,
    handleSave,
    handleConfirmDelete,
  } = usePaymentDetailSave({
    payment,
    isDuplicate,
    formData,
    calculators: {
      calculateTotal,
      calculateVatAmount,
      calculateSurchargeAmount,
      calculateNetAmount,
    },
    onUpdate,
    onCreate,
    onDelete,
    onClose,
  })

  const handleOpenLinkedEvent = () => {
    if (!linkedEvent) return
    const params = new URLSearchParams()
    params.set("eventId", linkedEvent.id)
    if (typeof linkedEvent.year === "number") {
      params.set("year", String(linkedEvent.year))
    }
    if (typeof linkedEvent.month === "number") {
      params.set("month", String(linkedEvent.month))
    }
    onClose()
    router.push(`/events?${params.toString()}`)
  }

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={isDuplicate ? "Duplicate Payment" : "Edit Payment"}
        maxWidth="lg"
        headerActions={
          !isDuplicate ? (
            <IconButton
              variant="danger"
              ariaLabel="Delete payment"
              title="Delete payment"
              onClick={() => {
                setDeleteError(null)
                setShowDeleteConfirm(true)
              }}
            >
              <TrashIcon />
            </IconButton>
          ) : undefined
        }
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus:ring-offset-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              aria-busy={isSaving}
              className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-offset-zinc-900"
            >
              {isDuplicate
                ? isCreating
                  ? "Creating..."
                  : "Create Payment"
                : isUpdating
                  ? "Saving..."
                  : "Save Changes"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}

          {linkedEvent && (
            <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900/60 dark:bg-blue-900/20">
              <button
                type="button"
                onClick={handleOpenLinkedEvent}
                className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
              >
                Linked event: {linkedEvent.title} ·{" "}
                {formatEventDateTime(linkedEvent)}
              </button>
            </div>
          )}

          <PaymentDetailFormFields
            formData={formData}
            suggestedTags={suggestedTags}
            showTagSuggestions={showTagSuggestions}
            showAdditionalFields={showAdditionalFields}
            onSetShowAdditionalFields={setShowAdditionalFields}
            onChangeField={handleChange}
            onTagSelect={handleTagSelect}
            onTagBlur={handleTagBlur}
            onClientChange={handleClientChange}
            onAddConcept={addConcept}
            onRemoveConcept={removeConcept}
            calculateTotal={calculateTotal}
            calculateVatAmount={calculateVatAmount}
            calculateSurchargeAmount={calculateSurchargeAmount}
            calculateNetAmount={calculateNetAmount}
            calculateDiscount={calculateDiscount}
          />

          <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Invoices
            </h3>

            {!isDuplicate && (
              <PaymentInvoicesSection payment={payment} onUpdate={onUpdate} />
            )}

            {isDuplicate && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Invoice and receipt links can be added after the duplicated
                payment is created.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {!isDuplicate && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete payment"
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          variant="danger"
          isPending={isDeleting}
          error={deleteError}
          onCancel={() => {
            setShowDeleteConfirm(false)
            setDeleteError(null)
          }}
          onConfirm={() => {
            void handleConfirmDelete()
          }}
        >
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Delete this payment? This action cannot be undone.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}
