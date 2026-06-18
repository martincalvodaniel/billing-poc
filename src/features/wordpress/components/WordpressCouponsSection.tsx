"use client"

import { useMemo, useState } from "react"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { useDeleteWordpressCoupon } from "@/features/wordpress/hooks/useWordpressCouponMutations"
import { useWordpressCoupons } from "@/features/wordpress/hooks/useWordpressCoupons"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { WordPressCoupon } from "@/lib/domain/entities/wordpress-coupon"
import { WordpressCouponCreateModal } from "./WordpressCouponCreateModal"
import { WordpressCouponDeleteDialog } from "./WordpressCouponDeleteDialog"
import { WordpressCouponsHeader } from "./WordpressCouponsHeader"
import { WordpressCouponsTable } from "./WordpressCouponsTable"
import { WordpressPagination } from "./WordpressPagination"
import { extractApiError } from "./wordpress-view-utils"

interface WordpressCouponsSectionProps {
  onConfirmed: (message: string) => void
}

export function WordpressCouponsSection({
  onConfirmed,
}: WordpressCouponsSectionProps) {
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<WordPressCoupon | null>(
    null
  )
  const { data, coupons, isLoading, error, mutate } = useWordpressCoupons({
    page,
  })
  const deleteMutation = useDeleteWordpressCoupon()
  const errorMessage = useMemo(() => {
    return error
      ? extractApiError(error, "Failed to fetch WordPress coupons")
      : null
  }, [error])
  const deleteError = deleteMutation.error
    ? extractApiError(deleteMutation.error, "Failed to delete WordPress coupon")
    : null

  const openCreateModal = useStableCallback(() => {
    setIsCreateOpen(true)
  })
  const closeCreateModal = useStableCallback(() => {
    setIsCreateOpen(false)
  })
  const handleReload = useStableCallback(() => {
    if (page === 1) {
      void mutate()
      return
    }
    setPage(1)
  })
  const handleCreated = useStableCallback((message: string) => {
    setPage(1)
    onConfirmed(message)
  })
  const handleDelete = useStableCallback(async () => {
    if (!couponToDelete) return
    try {
      await deleteMutation.trigger({ couponId: couponToDelete.id })
      onConfirmed(`Coupon ${couponToDelete.code} deleted`)
      setCouponToDelete(null)
    } catch {
      // The mutation error is displayed in the confirmation dialog.
    }
  })
  const confirmDelete = useStableCallback(() => {
    void handleDelete()
  })
  const closeDeleteDialog = useStableCallback(() => {
    if (deleteMutation.isMutating) return
    deleteMutation.reset()
    setCouponToDelete(null)
  })
  const showPreviousPage = useStableCallback(() => {
    setPage((current) => Math.max(1, current - 1))
  })
  const showNextPage = useStableCallback(() => {
    setPage((current) => current + 1)
  })

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <WordpressCouponsHeader
        onCreate={openCreateModal}
        onReload={handleReload}
        isReloadDisabled={isLoading}
      />

      {errorMessage ? <ErrorBanner bordered>{errorMessage}</ErrorBanner> : null}

      {isLoading && coupons.length === 0 ? (
        <EmptyState variant="card">Loading WordPress coupons...</EmptyState>
      ) : coupons.length === 0 ? (
        <EmptyState variant="card">No coupons found for this page.</EmptyState>
      ) : (
        <WordpressCouponsTable coupons={coupons} onDelete={setCouponToDelete} />
      )}

      <WordpressPagination
        pagination={data?.pagination}
        isLoading={isLoading}
        itemLabel="coupons"
        onPrevious={showPreviousPage}
        onNext={showNextPage}
      />

      <WordpressCouponCreateModal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        onCreated={handleCreated}
      />
      <WordpressCouponDeleteDialog
        coupon={couponToDelete}
        isPending={deleteMutation.isMutating}
        error={deleteError}
        onCancel={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
