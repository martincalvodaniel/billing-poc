import { Badge } from "@/app/components/Badge"
import { ConfirmDialog } from "@/app/components/ConfirmDialog"
import type { Payment } from "@/lib/domain/entities/payment"
import { formatCurrency, formatDate } from "@/lib/formatters"

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
    <ConfirmDialog
      isOpen
      title="Delete Payment"
      variant="danger"
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      isPending={isDeleting}
      onCancel={onClose}
      onConfirm={onConfirm}
    >
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
          <Badge tone={payment.type === "income" ? "success" : "danger"}>
            {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
          </Badge>
        </div>
        {payment.tag && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Tag:</span>
            <Badge tone="info">{payment.tag}</Badge>
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
    </ConfirmDialog>
  )
}
