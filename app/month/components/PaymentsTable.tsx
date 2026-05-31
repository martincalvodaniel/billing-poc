import { Badge } from "@/app/components/Badge"
import { EmptyState } from "@/app/components/EmptyState"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import { IconButton } from "@/app/components/IconButton"
import { DuplicateIcon } from "@/app/components/icons/DuplicateIcon"
import { TrashIcon } from "@/app/components/icons/TrashIcon"
import type { Payment } from "@/lib/domain/entities/payment"
import { formatCurrency, formatMonthYear } from "@/lib/formatters"
import {
  type PaymentInvoiceFilter,
  type PaymentSortKey,
  type PaymentSortState,
  type PaymentTypeFilter,
  paymentHasInvoiceKind,
} from "./monthlyPaymentsView-filters"

type ColumnAlign = "left" | "right"

function SortIndicator({
  active,
  dir,
}: {
  active: boolean
  dir: "asc" | "desc"
}) {
  if (!active) {
    return (
      <svg
        aria-hidden="true"
        className="h-3 w-3 text-zinc-400 dark:text-zinc-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l4-4 4 4M8 15l4 4 4-4"
        />
      </svg>
    )
  }
  return (
    <svg
      aria-hidden="true"
      className="h-3 w-3 text-zinc-700 dark:text-zinc-200"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={dir === "asc" ? "M8 15l4-4 4 4" : "M8 9l4 4 4-4"}
      />
    </svg>
  )
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  align,
}: {
  label: string
  sortKey: PaymentSortKey
  sort?: PaymentSortState
  onSortChange?: (key: PaymentSortKey) => void
  align: ColumnAlign
}) {
  const active = sort?.sortBy === sortKey
  const dir = sort?.sortDir ?? "desc"
  const ariaSort: "ascending" | "descending" | "none" = active
    ? dir === "asc"
      ? "ascending"
      : "descending"
    : "none"
  const justify = align === "right" ? "justify-end" : "justify-start"
  const alignClass = align === "right" ? "text-right" : "text-left"
  const baseTh = `px-6 py-3 ${alignClass} font-medium text-zinc-700 dark:text-zinc-300`

  if (!onSortChange) {
    return <th className={baseTh}>{label}</th>
  }

  return (
    <th aria-sort={ariaSort} className={baseTh}>
      <button
        type="button"
        onClick={() => onSortChange(sortKey)}
        aria-label={`Sort by ${label}`}
        className={`inline-flex w-full items-center gap-1 ${justify} cursor-pointer rounded text-inherit hover:text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:hover:text-zinc-100`}
      >
        <span>{label}</span>
        <SortIndicator active={active} dir={dir} />
      </button>
    </th>
  )
}

function InvoiceMarker({ has }: { has: boolean }) {
  return (
    <span
      role="img"
      aria-label={has ? "Has invoice" : "Without invoice"}
      className={`inline-flex items-center ${
        has
          ? "text-blue-600 dark:text-blue-400"
          : "text-rose-600 dark:text-rose-400"
      }`}
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h4m1-12H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 10h4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14h3"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.2 14c0-1 1-1.6 1.9-1.8m-1.2-2.2c.4-.3 1-.5 1.6-.5 1 0 1.8.5 1.8 1.3 0 1.6-2.2 1.1-2.2 2.7"
        />
      </svg>
      <span className="sr-only">{has ? "Has invoice" : "Without invoice"}</span>
    </span>
  )
}

function ReceiptMarker({ has }: { has: boolean }) {
  return (
    <span
      role="img"
      aria-label={has ? "Has receipt" : "Without receipt"}
      className={`inline-flex items-center ${
        has
          ? "text-blue-600 dark:text-blue-400"
          : "text-rose-600 dark:text-rose-400"
      }`}
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h4m1-12H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={has ? "M9.5 12.5l1.6 1.6 3-3" : "M9 9l6 6m0-6l-6 6"}
        />
      </svg>
      <span className="sr-only">{has ? "Has receipt" : "Without receipt"}</span>
    </span>
  )
}

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
}) {
  const hasSurcharge = filteredPayments.some(
    (p) => p.surcharge && p.surcharge > 0
  )

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {error && <ErrorBanner className="m-6">{error}</ErrorBanner>}

      {payments.length === 0 ? (
        <EmptyState variant="inline" className="px-6 py-12">
          No payments yet
        </EmptyState>
      ) : filteredPayments.length === 0 ? (
        <EmptyState variant="inline" className="px-6 py-12">
          No payments in {formatMonthYear(selectedDate)}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="w-14 px-3 py-3" />
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
                {hasSurcharge && (
                  <SortableHeader
                    label="Surcharge"
                    sortKey="surcharge"
                    sort={sort}
                    onSortChange={onSortChange}
                    align="right"
                  />
                )}
                <SortableHeader
                  label="Net"
                  sortKey="net"
                  sort={sort}
                  onSortChange={onSortChange}
                  align="right"
                />
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const hasInvoice = paymentHasInvoiceKind(payment, "invoice")
                const hasReceipt = paymentHasInvoiceKind(payment, "receipt")
                return (
                  <tr
                    key={payment._id}
                    onClick={() => onRowClick(payment._id || "")}
                    className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-3 py-4 text-zinc-900 dark:text-zinc-100">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onInvoiceFilterToggle(hasInvoice)
                          }}
                          aria-label={
                            hasInvoice
                              ? "Filter by payments with invoice"
                              : "Filter by payments without invoice"
                          }
                          className={`rounded p-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            (hasInvoice && hasInvoiceFilter === "yes") ||
                            (!hasInvoice && hasInvoiceFilter === "no")
                              ? "ring-1 ring-blue-500"
                              : ""
                          }`}
                          title={
                            hasInvoice ? "Invoice present" : "Invoice missing"
                          }
                        >
                          <InvoiceMarker has={hasInvoice} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onReceiptFilterToggle(hasReceipt)
                          }}
                          aria-label={
                            hasReceipt
                              ? "Filter by payments with receipt"
                              : "Filter by payments without receipt"
                          }
                          className={`rounded p-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            (hasReceipt && hasReceiptFilter === "yes") ||
                            (!hasReceipt && hasReceiptFilter === "no")
                              ? "ring-1 ring-blue-500"
                              : ""
                          }`}
                          title={
                            hasReceipt ? "Receipt present" : "Receipt missing"
                          }
                        >
                          <ReceiptMarker has={hasReceipt} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                      <span className="inline-block w-5 text-right tabular-nums">
                        {new Date(payment.date).getDate()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTypeFilterToggle(payment.type)
                        }}
                        aria-label={`Filter by ${payment.type}`}
                        className="rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <Badge
                          tone={
                            payment.type === "income" ? "success" : "danger"
                          }
                          className={
                            typeFilter === payment.type
                              ? "ring-1 ring-blue-500"
                              : undefined
                          }
                        >
                          {payment.type.charAt(0).toUpperCase() +
                            payment.type.slice(1)}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                      {payment.tag ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onTagFilterToggle(payment.tag ?? "")
                          }}
                          aria-label={`Filter by tag ${payment.tag}`}
                          className="rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <Badge
                            tone="info"
                            className={
                              selectedTags.includes(payment.tag)
                                ? "ring-1 ring-blue-500"
                                : undefined
                            }
                          >
                            {payment.tag}
                          </Badge>
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.total)}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      ({payment.vat}%) {formatCurrency(payment.vatAmount)}
                    </td>
                    {hasSurcharge && (
                      <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {payment.surcharge && payment.surcharge > 0 ? (
                          <span>
                            ({payment.surcharge}%){" "}
                            {formatCurrency(payment.surchargeAmount || 0)}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500 dark:text-zinc-500">
                            —
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.netAmount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <IconButton
                          variant="info"
                          stopPropagation
                          onClick={(e) =>
                            onDuplicateClick(e, payment._id || "")
                          }
                          ariaLabel="Duplicate payment"
                        >
                          <DuplicateIcon />
                        </IconButton>
                        <IconButton
                          variant="danger"
                          stopPropagation
                          onClick={(e) => onDeleteClick(e, payment._id || "")}
                          ariaLabel="Delete payment"
                        >
                          <TrashIcon />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
