import { BankTransferIcon } from "@/components/ui/icons/BankTransferIcon"
import { CardIcon } from "@/components/ui/icons/CardIcon"
import { CashIcon } from "@/components/ui/icons/CashIcon"
import { XIcon } from "@/components/ui/icons/XIcon"
import {
  type ColumnAlign,
  SortableTableHeader,
} from "@/components/ui/SortableTableHeader"
import type { Payment } from "@/lib/domain/entities/payment"
import type {
  PaymentSortKey,
  PaymentSortState,
} from "./monthlyPaymentsView-filters"

export function SortableHeader({
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
  return (
    <SortableTableHeader
      label={label}
      sortKey={sortKey}
      sort={sort}
      onSortChange={onSortChange}
      align={align}
      className={`px-6 py-3 ${align === "right" ? "text-right" : "text-left"} font-medium text-zinc-700 dark:text-zinc-300`}
      buttonClassName={`inline-flex w-full items-center gap-1 ${align === "right" ? "justify-end" : "justify-start"} cursor-pointer rounded text-inherit hover:text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:hover:text-zinc-100`}
    />
  )
}

export function InvoiceMarker({ has }: { has: boolean }) {
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
          d="M7 2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 2v5h5"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6M9 16h6"
        />
      </svg>
      <span className="sr-only">{has ? "Has invoice" : "Without invoice"}</span>
    </span>
  )
}

export function ReceiptMarker({ has }: { has: boolean }) {
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
          d="M7 3h10v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5V5a2 2 0 0 1 2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 9h6M9 12h6M9 15h4"
        />
      </svg>
      <span className="sr-only">{has ? "Has receipt" : "Without receipt"}</span>
    </span>
  )
}

export function PaymentMethodMarker({
  method,
}: {
  method?: Payment["paymentMethod"]
}) {
  if (!method) {
    return (
      <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
        <XIcon className="h-4 w-4" />
        <span className="sr-only">No payment method</span>
      </span>
    )
  }

  if (method === "cash") {
    return (
      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
        <CashIcon className="h-4 w-4" />
        <span className="sr-only">Cash</span>
      </span>
    )
  }

  if (method === "card") {
    return (
      <span className="inline-flex items-center text-blue-600 dark:text-blue-400">
        <CardIcon className="h-4 w-4" />
        <span className="sr-only">Card</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center text-zinc-700 dark:text-zinc-300">
      <BankTransferIcon className="h-4 w-4" />
      <span className="sr-only">Bank transfer</span>
    </span>
  )
}
