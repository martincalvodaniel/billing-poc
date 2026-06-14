import { Badge } from "@/components/ui/Badge"
import { IconButton } from "@/components/ui/IconButton"
import { DuplicateIcon } from "@/components/ui/icons/DuplicateIcon"
import { TrashIcon } from "@/components/ui/icons/TrashIcon"
import type { Payment } from "@/lib/domain/entities/payment"
import { formatCurrency } from "@/lib/utils/formatters"
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
  clientNameById,
  onClientClick,
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
  clientNameById: Map<string, string>
  onClientClick: (clientId: string) => void
}) {
  function handleRowClick() {
    return onRowClick(payment._id || "")
  }
  function handleInvoiceFilterToggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    onInvoiceFilterToggle(hasInvoice)
  }
  function handleReceiptFilterToggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    onReceiptFilterToggle(hasReceipt)
  }
  function handleTypeFilterToggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    onTypeFilterToggle(payment.type)
  }
  function handleTagFilterToggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    onTagFilterToggle(payment.tag ?? "")
  }
  function handleClientClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    onClientClick(payment.clientId ?? "")
  }
  function handleDuplicateClick(
    e: Parameters<
      NonNullable<React.ComponentProps<typeof IconButton>["onClick"]>
    >[0]
  ) {
    return onDuplicateClick(e, payment._id || "")
  }
  function handleDeleteClick(
    e: Parameters<
      NonNullable<React.ComponentProps<typeof IconButton>["onClick"]>
    >[0]
  ) {
    return onDeleteClick(e, payment._id || "")
  }
  const hasInvoice = paymentHasInvoiceKind(payment, "invoice")
  const hasReceipt = paymentHasInvoiceKind(payment, "receipt")
  const clientName = payment.clientId
    ? clientNameById.get(payment.clientId)
    : undefined
  return (
    <tr
      onClick={handleRowClick}
      className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
    >
      <td className="px-3 py-4 text-zinc-900 dark:text-zinc-100">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={handleInvoiceFilterToggle}
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
            onClick={handleReceiptFilterToggle}
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
          onClick={handleTypeFilterToggle}
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
            onClick={handleTagFilterToggle}
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
      <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
        {clientName && payment.clientId ? (
          <button
            type="button"
            onClick={handleClientClick}
            aria-label={`Edit client ${clientName}`}
            className="truncate rounded text-left text-emerald-700 hover:underline focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-emerald-400"
          >
            {clientName}
          </button>
        ) : payment.clientId ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            Unknown client
          </span>
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
      {hasSurcharge ? (
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
      ) : null}
      <td className="px-6 py-4 text-right">
        <div className="inline-flex items-center justify-end gap-1">
          <IconButton
            variant="info"
            stopPropagation
            onClick={handleDuplicateClick}
            ariaLabel="Duplicate payment"
          >
            <DuplicateIcon />
          </IconButton>
          <IconButton
            variant="danger"
            stopPropagation
            onClick={handleDeleteClick}
            ariaLabel="Delete payment"
          >
            <TrashIcon />
          </IconButton>
        </div>
      </td>
    </tr>
  )
}
