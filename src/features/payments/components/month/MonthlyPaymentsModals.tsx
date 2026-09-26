"use client"
import dynamic from "next/dynamic"
import type { Payment } from "@/lib/domain/entities/payment"
import { getPaymentNavigation } from "./payment-navigation"

const DeletePaymentModal = dynamic(() => import("./DeletePaymentModal"), {
  ssr: false,
})
const PaymentDetailModal = dynamic(() => import("./PaymentDetailModal"), {
  ssr: false,
})

export default function MonthlyPaymentsModals({
  payments,
  displayedPayments,
  deleteConfirmPaymentId,
  isDeleting,
  onCloseDelete,
  onConfirmDelete,
  editPaymentId,
  onCloseEdit,
  onNavigateEdit,
  onUpdate,
  onDeleteEdit,
  duplicateSeed,
  onCloseDuplicate,
  onCreateDuplicate,
}: {
  payments: Payment[]
  displayedPayments: Payment[]
  deleteConfirmPaymentId: string | null
  isDeleting: boolean
  onCloseDelete: () => void
  onConfirmDelete: () => void
  editPaymentId: string | null
  onCloseEdit: () => void
  onNavigateEdit: (paymentId: string) => void
  onUpdate: (payment: Payment) => void
  onDeleteEdit: () => void
  duplicateSeed: Payment | null
  onCloseDuplicate: () => void
  onCreateDuplicate: () => void
}) {
  const selectedPayment = editPaymentId
    ? payments.find((payment) => payment._id === editPaymentId)
    : undefined
  const navigation = editPaymentId
    ? getPaymentNavigation(displayedPayments, editPaymentId)
    : null
  const previousPaymentId = navigation?.previousPaymentId ?? null
  const nextPaymentId = navigation?.nextPaymentId ?? null

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

      {selectedPayment ? (
        <PaymentDetailModal
          key={editPaymentId}
          payment={selectedPayment}
          navigation={
            navigation
              ? {
                  currentPosition: navigation.currentPosition,
                  total: navigation.total,
                  onPrevious: previousPaymentId
                    ? () => onNavigateEdit(previousPaymentId)
                    : undefined,
                  onNext: nextPaymentId
                    ? () => onNavigateEdit(nextPaymentId)
                    : undefined,
                }
              : undefined
          }
          onClose={onCloseEdit}
          onUpdate={onUpdate}
          onDelete={onDeleteEdit}
        />
      ) : null}

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
