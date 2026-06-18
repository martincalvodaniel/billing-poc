"use client"
import { useMemo, useState } from "react"
import PageLayout from "@/components/shared/PageLayout"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import Toast from "@/components/ui/Toast"
import { WordpressBillingClientModal } from "@/features/wordpress/components/WordpressBillingClientModal"
import { WordpressCouponsSection } from "@/features/wordpress/components/WordpressCouponsSection"
import { WordpressOrderDetailsModal } from "@/features/wordpress/components/WordpressOrderDetailsModal"
import { WordpressOrderStatusModal } from "@/features/wordpress/components/WordpressOrderStatusModal"
import { WordpressOrdersHeader } from "@/features/wordpress/components/WordpressOrdersHeader"
import { WordpressOrdersTable } from "@/features/wordpress/components/WordpressOrdersTable"
import { WordpressPagination } from "@/features/wordpress/components/WordpressPagination"
import { extractApiError } from "@/features/wordpress/components/wordpress-view-utils"
import { useWordpressOrders } from "@/features/wordpress/hooks/useWordpressOrders"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"
export default function WordpressPage() {
  function clearToast() {
    return setToastMessage(null)
  }
  function handlePageChange() {
    if (page === 1) {
      void mutate()
      return
    }
    setPage(1)
  }
  function handleSelectedOrderChange(
    order: Parameters<
      NonNullable<
        React.ComponentProps<typeof WordpressOrdersTable>["onSelectOrder"]
      >
    >[0]
  ) {
    return setSelectedOrder(order)
  }
  function handleBillingOrderChange(
    order: Parameters<
      NonNullable<
        React.ComponentProps<typeof WordpressOrdersTable>["onSelectBilling"]
      >
    >[0]
  ) {
    return setBillingOrder(order)
  }
  function handleStatusOrderChange(
    order: Parameters<
      NonNullable<
        React.ComponentProps<typeof WordpressOrdersTable>["onSelectStatus"]
      >
    >[0]
  ) {
    return setStatusOrder(order)
  }
  function showPreviousPage() {
    return setPage((current) => {
      return Math.max(1, current - 1)
    })
  }
  function showNextPage() {
    return setPage((current) => {
      return current + 1
    })
  }
  function closeOrderDetails() {
    return setSelectedOrder(null)
  }
  function closeBillingModal() {
    return setBillingOrder(null)
  }
  function showBillingConfirmation(
    message: Parameters<
      NonNullable<
        React.ComponentProps<typeof WordpressBillingClientModal>["onConfirmed"]
      >
    >[0]
  ) {
    return setToastMessage(message)
  }
  function closeStatusModal() {
    return setStatusOrder(null)
  }
  function showStatusConfirmation(
    message: Parameters<
      NonNullable<
        React.ComponentProps<typeof WordpressOrderStatusModal>["onConfirmed"]
      >
    >[0]
  ) {
    return setToastMessage(message)
  }
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<WordPressOrder | null>(
    null
  )
  const [billingOrder, setBillingOrder] = useState<WordPressOrder | null>(null)
  const [statusOrder, setStatusOrder] = useState<WordPressOrder | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { data, orders, isLoading, error, mutate } = useWordpressOrders({
    page,
  })
  const errorMessage = useMemo(() => {
    if (!error) return null
    return extractApiError(error, "Failed to fetch WordPress orders")
  }, [error])
  const pagination = data?.pagination
  return (
    <PageLayout navigationSubtitle="WordPress Orders">
      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <WordpressOrdersHeader
          onReload={handlePageChange}
          isReloadDisabled={isLoading}
        />

        {errorMessage ? (
          <ErrorBanner bordered>{errorMessage}</ErrorBanner>
        ) : null}

        {isLoading && orders.length === 0 ? (
          <EmptyState variant="card">Loading WordPress orders...</EmptyState>
        ) : orders.length === 0 ? (
          <EmptyState variant="card">No orders found for this page.</EmptyState>
        ) : (
          <WordpressOrdersTable
            orders={orders}
            onSelectOrder={handleSelectedOrderChange}
            onSelectBilling={handleBillingOrderChange}
            onSelectStatus={handleStatusOrderChange}
          />
        )}

        <WordpressPagination
          pagination={pagination}
          isLoading={isLoading}
          onPrevious={showPreviousPage}
          onNext={showNextPage}
        />
      </section>

      <WordpressCouponsSection onConfirmed={setToastMessage} />

      <WordpressOrderDetailsModal
        order={selectedOrder}
        onClose={closeOrderDetails}
      />

      <WordpressBillingClientModal
        order={billingOrder}
        onClose={closeBillingModal}
        onConfirmed={showBillingConfirmation}
      />

      <WordpressOrderStatusModal
        order={statusOrder}
        onClose={closeStatusModal}
        onConfirmed={showStatusConfirmation}
      />

      {toastMessage ? (
        <Toast message={toastMessage} onClose={clearToast} />
      ) : null}
    </PageLayout>
  )
}
