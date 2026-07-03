import { useState } from "react"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import type { Payment } from "@/lib/domain/entities/payment"
import { formatMonthYear } from "@/lib/utils/formatters"
import type {
  PaymentInvoiceFilter,
  PaymentSortKey,
  PaymentSortState,
  PaymentTypeFilter,
} from "./monthlyPaymentsView-filters"
import PaymentRow from "./PaymentRow"
import { SortableHeader } from "./PaymentsTableCells"
export default function PaymentsTable({
  payments,
  filteredPayments,
  selectedDate,
  error,
  onRowClick,
  onDeleteClick,
  onDuplicateClick,
  sort,
  onSortChange,
  typeFilter,
  hasInvoiceFilter,
  hasReceiptFilter,
  selectedTags,
  onTypeFilterToggle,
  onInvoiceFilterToggle,
  onReceiptFilterToggle,
  onTagFilterToggle,
  clientNameById,
  onClientClick,
}: {
  payments: Payment[]
  filteredPayments: Payment[]
  selectedDate: Date
  error: string | null
  onRowClick: (paymentId: string) => void
  onDeleteClick: (e: React.MouseEvent, paymentId: string) => void
  onDuplicateClick: (e: React.MouseEvent, paymentId: string) => void
  sort?: PaymentSortState
  onSortChange?: (key: PaymentSortKey) => void
  typeFilter: PaymentTypeFilter
  hasInvoiceFilter: PaymentInvoiceFilter
  hasReceiptFilter: PaymentInvoiceFilter
  selectedTags: string[]
  onTypeFilterToggle: (type: "income" | "outcome") => void
  onInvoiceFilterToggle: (hasInvoice: boolean) => void
  onReceiptFilterToggle: (hasReceipt: boolean) => void
  onTagFilterToggle: (tag: string) => void
  clientNameById: Map<string, string>
  onClientClick: (clientId: string) => void
}) {
  const [showAllMoneyColumns, setShowAllMoneyColumns] = useState(false)
  const showCompactMoneyColumns = () => setShowAllMoneyColumns(false)
  const showDetailedMoneyColumns = () => setShowAllMoneyColumns(true)

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {error ? <ErrorBanner className="m-6">{error}</ErrorBanner> : null}

      {payments.length === 0 ? (
        <EmptyState variant="inline" className="px-6 py-12">
          No payments yet
        </EmptyState>
      ) : filteredPayments.length === 0 ? (
        <EmptyState variant="inline" className="px-6 py-12">
          No payments in {formatMonthYear(selectedDate)}
        </EmptyState>
      ) : (
        <>
          <div className="flex justify-end border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <fieldset
              className="inline-flex h-9 items-stretch overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700"
              aria-label="Toggle money columns"
            >
              <legend className="sr-only">Toggle money columns</legend>
              <button
                type="button"
                onClick={showCompactMoneyColumns}
                aria-pressed={!showAllMoneyColumns}
                className={`h-full px-3 text-sm font-medium transition ${
                  !showAllMoneyColumns
                    ? "bg-blue-600 text-white dark:bg-blue-700"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                Compact
              </button>
              <button
                type="button"
                onClick={showDetailedMoneyColumns}
                aria-pressed={showAllMoneyColumns}
                className={`h-full px-3 text-sm font-medium transition ${
                  showAllMoneyColumns
                    ? "bg-blue-600 text-white dark:bg-blue-700"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                All
              </button>
            </fieldset>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="w-14 px-3 py-3" />
                  <SortableHeader
                    label="Invoice"
                    sortKey="invoices"
                    sort={sort}
                    onSortChange={onSortChange}
                    align="left"
                  />
                  <SortableHeader
                    label="Day"
                    sortKey="day"
                    sort={sort}
                    onSortChange={onSortChange}
                    align="left"
                  />
                  <SortableHeader
                    label="Type"
                    sortKey="type"
                    sort={sort}
                    onSortChange={onSortChange}
                    align="left"
                  />
                  <SortableHeader
                    label="Tag"
                    sortKey="tag"
                    sort={sort}
                    onSortChange={onSortChange}
                    align="left"
                  />
                  <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Client
                  </th>
                  <SortableHeader
                    label="Total"
                    sortKey="total"
                    sort={sort}
                    onSortChange={onSortChange}
                    align="right"
                  />
                  <SortableHeader
                    label="VAT"
                    sortKey="vat"
                    sort={sort}
                    onSortChange={onSortChange}
                    align="right"
                  />
                  {showAllMoneyColumns ? (
                    <SortableHeader
                      label="Surcharge"
                      sortKey="surcharge"
                      sort={sort}
                      onSortChange={onSortChange}
                      align="right"
                    />
                  ) : null}
                  {showAllMoneyColumns ? (
                    <SortableHeader
                      label="Net"
                      sortKey="net"
                      sort={sort}
                      onSortChange={onSortChange}
                      align="right"
                    />
                  ) : null}
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  return (
                    <PaymentRow
                      key={payment._id}
                      payment={payment}
                      showAllMoneyColumns={showAllMoneyColumns}
                      onRowClick={onRowClick}
                      onDeleteClick={onDeleteClick}
                      onDuplicateClick={onDuplicateClick}
                      typeFilter={typeFilter}
                      hasInvoiceFilter={hasInvoiceFilter}
                      hasReceiptFilter={hasReceiptFilter}
                      selectedTags={selectedTags}
                      onTypeFilterToggle={onTypeFilterToggle}
                      onInvoiceFilterToggle={onInvoiceFilterToggle}
                      onReceiptFilterToggle={onReceiptFilterToggle}
                      onTagFilterToggle={onTagFilterToggle}
                      clientNameById={clientNameById}
                      onClientClick={onClientClick}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
