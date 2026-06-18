"use client"

import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import type { WordPressCoupon } from "@/lib/domain/entities/wordpress-coupon"

interface WordpressCouponDeleteDialogProps {
  coupon: WordPressCoupon | null
  isPending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function WordpressCouponDeleteDialog({
  coupon,
  isPending,
  error,
  onCancel,
  onConfirm,
}: WordpressCouponDeleteDialogProps) {
  return (
    <ConfirmDialog
      isOpen={coupon !== null}
      title="Delete WordPress coupon"
      confirmLabel="Delete coupon"
      pendingLabel="Deleting..."
      variant="danger"
      isPending={isPending}
      error={error}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Delete coupon{" "}
        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
          {coupon?.code ?? ""}
        </span>
        ? This cannot be undone.
      </p>
    </ConfirmDialog>
  )
}
