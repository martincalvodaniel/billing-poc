"use client"

import dynamic from "next/dynamic"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Modal } from "@/components/ui/Modal"
import { usePayment } from "@/features/payments/hooks/usePayments"
import type { Payment } from "@/lib/domain/entities/payment"

const PaymentDetailModal = dynamic(
  () => import("@/features/payments/components/month/PaymentDetailModal"),
  { ssr: false }
)

interface InvoicePaymentModalProps {
  paymentId: string
  onClose: () => void
  onUpdate: (payment: Payment) => void
  onDelete: (paymentId: string) => void
}

export default function InvoicePaymentModal({
  paymentId,
  onClose,
  onUpdate,
  onDelete,
}: InvoicePaymentModalProps) {
  const { payment, error, isLoading } = usePayment(paymentId)

  if (payment) {
    return (
      <PaymentDetailModal
        key={paymentId}
        payment={payment}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    )
  }

  return (
    <Modal isOpen onClose={onClose} title="Payment details" maxWidth="sm">
      {error ? (
        <ErrorBanner>Failed to load payment details.</ErrorBanner>
      ) : (
        <p
          role="status"
          aria-live="polite"
          className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400"
        >
          {isLoading ? "Loading payment..." : "Payment not found."}
        </p>
      )}
    </Modal>
  )
}
