"use client"

import { useMemo, useState } from "react"
import { EmptyState } from "@/app/components/EmptyState"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import { Modal } from "@/app/components/Modal"
import PageLayout from "@/app/components/PageLayout"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"
import { formatCurrency, formatDate } from "@/lib/formatters"
import { useWordpressOrders } from "@/lib/hooks/useWordpressOrders"
import { FetchError } from "@/lib/swr-fetcher"

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatOrderDate(value: string): string {
  return value.length > 0 ? formatDate(value) : "-"
}

function orderStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    default:
      return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
  }
}

function extractApiError(err: unknown, fallback: string): string {
  if (
    err instanceof FetchError &&
    err.info &&
    typeof err.info === "object" &&
    "error" in err.info &&
    typeof (err.info as { error: unknown }).error === "string"
  ) {
    return (err.info as { error: string }).error
  }
  if (err instanceof Error) {
    return err.message
  }
  return fallback
}

export default function WordpressPage() {
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<WordPressOrder | null>(
    null
  )

  const { data, orders, isLoading, error } = useWordpressOrders({ page })

  const errorMessage = useMemo(() => {
    if (!error) return null
    return extractApiError(error, "Failed to fetch WordPress orders")
  }, [error])

  const pagination = data?.pagination

  return (
    <PageLayout navigationSubtitle="WordPress Orders">
      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              WordPress Orders
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Summary view with billing, items, and taxes available in details.
            </p>
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            {pagination
              ? `Page ${pagination.page} of ${pagination.totalPages}`
              : "-"}
          </div>
        </div>

        {errorMessage && <ErrorBanner bordered>{errorMessage}</ErrorBanner>}

        {isLoading && orders.length === 0 ? (
          <EmptyState variant="card">Loading WordPress orders...</EmptyState>
        ) : orders.length === 0 ? (
          <EmptyState variant="card">No orders found for this page.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                    Billing
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                    Paid Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          #{order.id}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {order.billing.first_name} {order.billing.last_name}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {order.billing.phone} - {order.billing.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">
                        {order.payment_method_title}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {order.payment_method}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(parseAmount(order.total))}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-zinc-900 dark:text-zinc-100">
                      {formatOrderDate(order.date_paid || order.date_completed)}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
                        aria-label={`View details for order ${order.id}`}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={isLoading || !pagination?.hasPrevPage}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
          >
            Previous
          </button>

          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {pagination
              ? `Showing page ${pagination.page} of ${pagination.totalPages} (${pagination.total} orders)`
              : "-"}
          </p>

          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={isLoading || !pagination?.hasNextPage}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
          >
            Next
          </button>
        </div>
      </section>

      <Modal
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={
          selectedOrder ? `Order #${selectedOrder.id} details` : "Order details"
        }
        maxWidth="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                  Billing
                </h3>
                <div className="mt-2 space-y-1 text-sm text-zinc-800 dark:text-zinc-100">
                  <p>
                    {selectedOrder.billing.first_name}{" "}
                    {selectedOrder.billing.last_name}
                  </p>
                  <p>{selectedOrder.billing.address_1}</p>
                  {selectedOrder.billing.address_2.length > 0 && (
                    <p>{selectedOrder.billing.address_2}</p>
                  )}
                  <p>
                    {selectedOrder.billing.postcode}{" "}
                    {selectedOrder.billing.city}
                  </p>
                  <p>{selectedOrder.billing.country}</p>
                  <p>{selectedOrder.billing.email}</p>
                  <p>{selectedOrder.billing.phone}</p>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                  Order totals
                </h3>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-zinc-600 dark:text-zinc-300">
                    Subtotal taxes
                  </dt>
                  <dd className="text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(parseAmount(selectedOrder.cart_tax))}
                  </dd>
                  <dt className="text-zinc-600 dark:text-zinc-300">Discount</dt>
                  <dd className="text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(parseAmount(selectedOrder.discount_total))}
                  </dd>
                  <dt className="text-zinc-600 dark:text-zinc-300">
                    Total tax
                  </dt>
                  <dd className="text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(parseAmount(selectedOrder.total_tax))}
                  </dd>
                  <dt className="text-zinc-600 dark:text-zinc-300">Total</dt>
                  <dd className="text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(parseAmount(selectedOrder.total))}
                  </dd>
                </dl>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Line items
              </h3>
              {selectedOrder.line_items.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  No line items
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                          Item
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                          SKU
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                          Total
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                          Tax
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                      {selectedOrder.line_items.map((item) => (
                        <tr key={`${item.sku}-${item.name}-${item.quantity}`}>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                            {item.sku}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(parseAmount(item.total))}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(parseAmount(item.total_tax))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Tax lines
              </h3>
              {selectedOrder.tax_lines.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  No tax lines
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                          Tax
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                          Rate
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                      {selectedOrder.tax_lines.map((taxLine) => (
                        <tr key={taxLine.id}>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
                            {taxLine.label}
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                            {taxLine.rate_code} ({taxLine.rate_percent}%)
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(parseAmount(taxLine.tax_total))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </Modal>
    </PageLayout>
  )
}
