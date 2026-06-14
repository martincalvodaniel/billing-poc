"use client"
import dynamic from "next/dynamic"
import type { Payment } from "@/lib/domain/entities/payment"

const DeletePaymentModal = dynamic(() => import("./DeletePaymentModal"), {
  ssr: false,
})
const PaymentDetailModal = dynamic(() => import("./PaymentDetailModal"), {
  ssr: false,
})

export default function MonthlyPaymentsModals({
  payments,
  deleteConfirmPaymentId,
  isDeleting,
  onCloseDelete,
  onConfirmDelete,
  editPaymentId,
  onCloseEdit,
  onUpdate,
  onDeleteEdit,
  duplicateSeed,
  onCloseDuplicate,
  onCreateDuplicate,
}: {
  payments: Payment[]
  deleteConfirmPaymentId: string | null
  isDeleting: boolean
  onCloseDelete: () => void
  onConfirmDelete: () => void
  editPaymentId: string | null
  onCloseEdit: () => void
  onUpdate: (payment: Payment) => void
  onDeleteEdit: () => void
  duplicateSeed: Payment | null
  onCloseDuplicate: () => void
  onCreateDuplicate: () => void
}) {
  return (
    <>
      {deleteConfirmPaymentId ? (
        <DeletePaymentModal
          payment={payments.find((p) => p._id === deleteConfirmPaymentId)}
          isDeleting={isDeleting}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
        />
      ) : null}

      {editPaymentId
        ? (() => {
            const selectedPayment = payments.find(
              (p) => p._id === editPaymentId
            )
            if (!selectedPayment) return null
            return (
              <PaymentDetailModal
                payment={selectedPayment}
                onClose={onCloseEdit}
                onUpdate={onUpdate}
                onDelete={onDeleteEdit}
              />
            )
          })()
        : null}

      {duplicateSeed ? (
        <PaymentDetailModal
          payment={duplicateSeed}
          mode="duplicate"
          onClose={onCloseDuplicate}
          onCreate={onCreateDuplicate}
        />
      ) : null}
    </>
  )
}
