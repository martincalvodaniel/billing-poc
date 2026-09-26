"use client"

import { memo, useCallback } from "react"
import { buildOpenInvoiceUrl } from "@/features/invoices/hooks/useInvoiceMutations"
import { formatCurrency, formatDate } from "@/lib/utils/formatters"
import type { GeneratedInvoiceSnapshot } from "../hooks/useInvoiceCounters"

interface InvoiceRecordListProps {
  invoices: GeneratedInvoiceSnapshot[]
  emptyMessage?: string
  onPaymentClick?: (paymentId: string) => void
}

interface InvoicePaymentTitleProps {
  paymentId: string
  title: string
  onPaymentClick: (paymentId: string) => void
}

const InvoicePaymentTitle = memo(function InvoicePaymentTitle({
  paymentId,
  title,
  onPaymentClick,
}: InvoicePaymentTitleProps) {
  const handleClick = useCallback(
    () => onPaymentClick(paymentId),
    [onPaymentClick, paymentId]
  )
  return (
    <button
      type="button"
      onClick={handleClick}
      className="block max-w-full truncate rounded-sm text-left text-sm text-zinc-700 underline-offset-2 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-zinc-200 dark:hover:text-blue-300 dark:focus:ring-offset-zinc-900"
    >
      {title}
    </button>
  )
})

function InvoiceRecordListComponent({
  invoices,
  emptyMessage = "No invoices generated in this series.",
  onPaymentClick,
}: InvoiceRecordListProps) {
  if (invoices.length === 0) {
    return (
      <p className="px-4 py-5 text-sm text-zinc-500 dark:text-zinc-400">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="max-h-80 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-700">
      {invoices.map((invoice) => (
        <li
          key={`${invoice.paymentId}:${invoice.id}`}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <a
              href={buildOpenInvoiceUrl(invoice.paymentId, invoice.id)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm font-semibold text-blue-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-blue-300 dark:focus:ring-offset-zinc-900"
            >
              {invoice.id}
            </a>
            {onPaymentClick ? (
              <InvoicePaymentTitle
                paymentId={invoice.paymentId}
                title={invoice.paymentDescription}
                onPaymentClick={onPaymentClick}
              />
            ) : (
              <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">
                {invoice.paymentDescription}
              </p>
            )}
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatCurrency(invoice.paymentTotal)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Payment {formatDate(invoice.paymentDate)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

const InvoiceRecordList = memo(InvoiceRecordListComponent)
export default InvoiceRecordList
