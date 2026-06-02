"use client"

import { useMemo, useState } from "react"
import { EmptyState } from "@/app/components/EmptyState"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import PageLayout from "@/app/components/PageLayout"
import Toast from "@/app/components/Toast"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"
import { useWordpressOrders } from "@/lib/hooks/useWordpressOrders"
import { WordpressBillingClientModal } from "./components/WordpressBillingClientModal"
import { WordpressOrderDetailsModal } from "./components/WordpressOrderDetailsModal"
import { WordpressOrdersHeader } from "./components/WordpressOrdersHeader"
import { WordpressOrdersTable } from "./components/WordpressOrdersTable"
import { WordpressPagination } from "./components/WordpressPagination"
import { extractApiError } from "./components/wordpress-view-utils"

export default function WordpressPage() {
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<WordPressOrder | null>(
    null
  )
  const [billingOrder, setBillingOrder] = useState<WordPressOrder | null>(null)
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
          onReload={() => {
            if (page === 1) {
              void mutate()
              return
            }

            setPage(1)
          }}
          isReloadDisabled={isLoading}
        />

        {errorMessage && <ErrorBanner bordered>{errorMessage}</ErrorBanner>}

        {isLoading && orders.length === 0 ? (
          <EmptyState variant="card">Loading WordPress orders...</EmptyState>
        ) : orders.length === 0 ? (
          <EmptyState variant="card">No orders found for this page.</EmptyState>
        ) : (
          <WordpressOrdersTable
            orders={orders}
            onSelectOrder={(order) => setSelectedOrder(order)}
            onSelectBilling={(order) => setBillingOrder(order)}
          />
        )}

        <WordpressPagination
          pagination={pagination}
          isLoading={isLoading}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => current + 1)}
        />
      </section>

      <WordpressOrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      <WordpressBillingClientModal
        order={billingOrder}
        onClose={() => setBillingOrder(null)}
        onConfirmed={(message) => setToastMessage(message)}
      />

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </PageLayout>
  )
}
