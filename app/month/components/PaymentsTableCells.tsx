import { BankTransferIcon } from "@/app/components/icons/BankTransferIcon"
import { CardIcon } from "@/app/components/icons/CardIcon"
import { CashIcon } from "@/app/components/icons/CashIcon"
import { XIcon } from "@/app/components/icons/XIcon"
import type { Payment } from "@/lib/domain/entities/payment"
import type {
  PaymentSortKey,
  PaymentSortState,
} from "./monthlyPaymentsView-filters"

export type ColumnAlign = "left" | "right"

export function SortIndicator({
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
