"use client"

import { ErrorBanner } from "@/app/components/ErrorBanner"
import { getPaymentInvoices } from "@/lib/domain/entities/payment"
import { buildOpenInvoiceUrl } from "@/lib/hooks/useInvoiceMutations"
import type { InvoiceSeries, Payment } from "@/lib/types"
import {
  type InvoiceButtonAction,
  invoiceButtonState,
  seriesLabel,
} from "./PaymentInvoiceSection-utils"

interface PaymentInvoiceSectionProps {
  payment: Payment
  invoiceError?: string | null
  isGenerating: boolean
  onGenerate: (series: InvoiceSeries) => void
}

const BASE_BUTTON =
  "flex-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"

const PRIMARY_BLUE =
  "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:ring-blue-500"

const RECTIFICATIVE_AMBER =
  "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 focus:ring-amber-500"

function buttonClasses(action: InvoiceButtonAction): string {
  return `${BASE_BUTTON} ${action.rectificative ? RECTIFICATIVE_AMBER : PRIMARY_BLUE}`
}

export default function PaymentInvoiceSection({
  payment,
  invoiceError,
  isGenerating,
  onGenerate,
}: PaymentInvoiceSectionProps) {
  const invoices = getPaymentInvoices(payment)
  const state = invoiceButtonState(invoices)
  const paymentId = payment._id?.toString() ?? ""
  const disabled = isGenerating || !paymentId

  return (
    <div className="space-y-3">
      {invoiceError && <ErrorBanner>{invoiceError}</ErrorBanner>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onGenerate(state.primary.series)}
          disabled={disabled}
          aria-busy={isGenerating}
          className={buttonClasses(state.primary)}
        >
          {isGenerating ? "Generating..." : state.primary.label}
        </button>
        <button
          type="button"
          onClick={() => onGenerate(state.simple.series)}
          disabled={disabled}
          aria-busy={isGenerating}
          className={buttonClasses(state.simple)}
        >
          {isGenerating ? "Generating..." : state.simple.label}
        </button>
      </div>

      {invoices.length > 0 && (
        <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {invoices.map((i) => (
            <li key={`${i.series}-${i.number}`}>
              <a
                href={buildOpenInvoiceUrl(paymentId, i.series, i.number)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {i.formattedNumber}
              </a>{" "}
              <span className="text-zinc-500 dark:text-zinc-400">
                ({seriesLabel(i.series)}) —{" "}
                {new Date(i.generatedAt).toLocaleDateString("es-ES")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
