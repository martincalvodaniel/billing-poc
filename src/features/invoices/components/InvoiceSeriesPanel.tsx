"use client"

import { memo, useCallback } from "react"
import InvoiceRecordList from "./InvoiceRecordList"
import {
  formatInvoiceCounter,
  type InvoiceSeriesCounter,
} from "./invoice-counter-groups"

interface InvoiceSeriesPanelProps {
  counter: InvoiceSeriesCounter
  year: number
  onReduce: (year: number, counter: InvoiceSeriesCounter) => void
  onPaymentClick: (paymentId: string) => void
}

function InvoiceSeriesPanelComponent({
  counter,
  year,
  onReduce,
  onPaymentClick,
}: InvoiceSeriesPanelProps) {
  const handleReduce = useCallback(
    () => onReduce(year, counter),
    [counter, onReduce, year]
  )
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {counter.label}
            </h3>
            <span className="rounded bg-zinc-200 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {counter.prefix}
            </span>
          </div>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
            {formatInvoiceCounter(counter.lastNumber)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {counter.lastNumber === 0
              ? "No invoices issued"
              : "Last assigned number"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleReduce}
          disabled={counter.lastNumber === 0}
          className="shrink-0 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-800 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40 dark:focus:ring-offset-zinc-900"
        >
          Reduce numbering
        </button>
      </div>
      <div className="border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Generated invoices
          </h4>
          <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            {counter.invoices.length}
          </span>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <InvoiceRecordList
            invoices={counter.invoices}
            onPaymentClick={onPaymentClick}
          />
        </div>
      </div>
    </article>
  )
}

const InvoiceSeriesPanel = memo(InvoiceSeriesPanelComponent)
export default InvoiceSeriesPanel
