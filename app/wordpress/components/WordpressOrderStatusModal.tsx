"use client"

import { ConfirmFooter, Modal } from "@/app/components/Modal"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"
import { useUpdateWordpressOrderStatus } from "@/lib/hooks/useWordpressOrderMutations"
import { extractApiError } from "./wordpress-view-utils"

interface WordpressOrderStatusModalProps {
  order: WordPressOrder | null
  onClose: () => void
  onConfirmed?: (message: string) => void
}

export function WordpressOrderStatusModal({
  order,
  onClose,
  onConfirmed,
}: WordpressOrderStatusModalProps) {
  const { trigger, isMutating, error, reset } = useUpdateWordpressOrderStatus()

  const handleClose = () => {
    if (isMutating) return
    reset()
    onClose()
  }

  const handleConfirm = async () => {
    if (!order) return

    try {
      await trigger({ orderId: order.id, status: "completed" })
      onConfirmed?.(`Order #${order.id} marked as completed`)
      reset()
      onClose()
    } catch {
      // The mutation hook exposes the error so the modal can show it inline.
    }
  }

  return (
    <Modal
      isOpen={order !== null}
      onClose={handleClose}
      title={order ? `Change order #${order.id} status` : "Change status"}
      footer={
        <ConfirmFooter
          onCancel={handleClose}
          onConfirm={() => {
            void handleConfirm()
          }}
          isPending={isMutating}
          confirmLabel="Mark completed"
          pendingLabel="Updating..."
        />
      }
    >
      {order && (
        <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            Change this order from{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {order.status}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              completed
            </span>
            ?
          </p>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {extractApiError(error, "Failed to update WordPress order")}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
