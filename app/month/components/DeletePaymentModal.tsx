import { formatCurrency, formatDate } from "@/lib/formatters"
import type { Payment } from "@/lib/types"
import { ConfirmFooter, Modal } from "../../components/Modal"

export default function DeletePaymentModal({
  payment,
  isDeleting,
  onClose,
  onConfirm,
}: {
  payment: Payment | undefined
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  if (!payment) return null

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Delete Payment"
      maxWidth="sm"
      footer={
        <ConfirmFooter
          onCancel={onClose}
          onConfirm={onConfirm}
          isPending={isDeleting}
          confirmLabel="Delete"
          pendingLabel="Deleting..."
          variant="danger"
        />
      }
    >
      <div className="space-y-4">
        <p>Are you sure you want to delete this payment?</p>
        <div className="mt-4 space-y-3 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Date:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatDate(payment.date)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Type:</span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                payment.type === "income"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
            </span>
          </div>
          {payment.tag && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Tag:</span>
              <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {payment.tag}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium">
            <span className="text-zinc-600 dark:text-zinc-400">Total:</span>
            <span className="text-zinc-900 dark:text-zinc-100">
              {formatCurrency(payment.total)}
            </span>
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This action cannot be undone.
        </p>
      </div>
    </Modal>
  )
}
