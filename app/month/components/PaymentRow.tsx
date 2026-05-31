import { Badge } from "@/app/components/Badge"
import { IconButton } from "@/app/components/IconButton"
import { DuplicateIcon } from "@/app/components/icons/DuplicateIcon"
import { TrashIcon } from "@/app/components/icons/TrashIcon"
import type { Payment } from "@/lib/domain/entities/payment"
import { formatCurrency } from "@/lib/formatters"
import {
  type PaymentInvoiceFilter,
  type PaymentTypeFilter,
  paymentHasInvoiceKind,
} from "./monthlyPaymentsView-filters"
import {
  InvoiceMarker,
  PaymentMethodMarker,
  ReceiptMarker,
} from "./PaymentsTableCells"

export default function PaymentRow({
  payment,
  hasSurcharge,
  onRowClick,
  onDeleteClick,
  onDuplicateClick,
  typeFilter,
  hasInvoiceFilter,
  hasReceiptFilter,
  selectedTags,
  onTypeFilterToggle,
  onInvoiceFilterToggle,
  onReceiptFilterToggle,
  onTagFilterToggle,
}: {
  payment: Payment
  hasSurcharge: boolean
  onRowClick: (paymentId: string) => void
  onDeleteClick: (e: React.MouseEvent, paymentId: string) => void
  onDuplicateClick: (e: React.MouseEvent, paymentId: string) => void
  typeFilter: PaymentTypeFilter
  hasInvoiceFilter: PaymentInvoiceFilter
  hasReceiptFilter: PaymentInvoiceFilter
  selectedTags: string[]
  onTypeFilterToggle: (type: "income" | "outcome") => void
  onInvoiceFilterToggle: (hasInvoice: boolean) => void
  onReceiptFilterToggle: (hasReceipt: boolean) => void
  onTagFilterToggle: (tag: string) => void
}) {
  const hasInvoice = paymentHasInvoiceKind(payment, "invoice")
  const hasReceipt = paymentHasInvoiceKind(payment, "receipt")
  return (
    <tr
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
            title={hasInvoice ? "Invoice present" : "Invoice missing"}
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
            title={hasReceipt ? "Receipt present" : "Receipt missing"}
          >
            <ReceiptMarker has={hasReceipt} />
          </button>
          <span title={payment.paymentMethod ?? "No payment method"}>
            <PaymentMethodMarker method={payment.paymentMethod} />
          </span>
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
            tone={payment.type === "income" ? "success" : "danger"}
            className={
              typeFilter === payment.type ? "ring-1 ring-blue-500" : undefined
            }
          >
            {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
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
          <span className="text-xs text-zinc-500 dark:text-zinc-500">—</span>
        )}
      </td>
      <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
        {formatCurrency(payment.total)}
      </td>
      <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
        {formatCurrency(payment.netAmount)}
      </td>
      <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
        ({payment.vat}%) {formatCurrency(payment.vatAmount)}
      </td>
      {hasSurcharge && (
        <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
          {typeof payment.surcharge === "number" && payment.surcharge !== 0 ? (
            <span>
              ({payment.surcharge}%){" "}
              {formatCurrency(payment.surchargeAmount || 0)}
            </span>
          ) : (
            <span className="text-xs text-zinc-500 dark:text-zinc-500">—</span>
          )}
        </td>
      )}
      <td className="px-6 py-4 text-right">
        <div className="inline-flex items-center justify-end gap-1">
          <IconButton
            variant="info"
            stopPropagation
            onClick={(e) => onDuplicateClick(e, payment._id || "")}
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
}
