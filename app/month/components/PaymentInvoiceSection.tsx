"use client"

import { ErrorBanner } from "@/app/components/ErrorBanner"
import type { InvoiceSeries, Payment } from "@/lib/types"

interface PaymentInvoiceSectionProps {
  idPrefix: string
  payment: Payment
  selectedSeries: InvoiceSeries
  onSelectSeries: (series: InvoiceSeries) => void
  invoiceError: string | null
  isGenerating: boolean
  onGenerate: () => void
  onDownload: () => void
}

export default function PaymentInvoiceSection({
  idPrefix,
  payment,
  selectedSeries,
  onSelectSeries,
  invoiceError,
  isGenerating,
  onGenerate,
  onDownload,
}: PaymentInvoiceSectionProps) {
  if (payment.invoice) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            <span className="font-medium">Series:</span>{" "}
            {payment.invoice.series}
          </p>
          <p>
            <span className="font-medium">Number:</span>{" "}
            {String(payment.invoice.number).padStart(6, "0")}
          </p>
          <p>
            <span className="font-medium">Generated:</span>{" "}
            {new Date(payment.invoice.generatedAt).toLocaleDateString("es-ES")}
          </p>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Invoice
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invoiceError && <ErrorBanner>{invoiceError}</ErrorBanner>}
      <div className="space-y-2">
        <label
          htmlFor={`${idPrefix}-invoice-series`}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Invoice Series
        </label>
        <select
          id={`${idPrefix}-invoice-series`}
          value={selectedSeries}
          onChange={(e) => onSelectSeries(e.target.value as InvoiceSeries)}
          disabled={isGenerating}
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="Invoice">Invoice</option>
          <option value="RectificativeInvoice">Rectificative Invoice</option>
          <option value="SimpleInvoice">Simple Invoice</option>
          <option value="RectificativeSimpleInvoice">
            Rectificative Simple Invoice
          </option>
        </select>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
      >
        {isGenerating ? "Generating..." : "Generate Invoice"}
      </button>
    </div>
  )
}
