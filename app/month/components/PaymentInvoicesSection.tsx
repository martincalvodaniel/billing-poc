"use client"

import { useId, useState } from "react"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import {
  getPaymentInvoices,
  type InvoiceMetadata,
} from "@/lib/domain/entities/payment"
import {
  type AppendLinkInvoiceType,
  useAppendLinkInvoice,
} from "@/lib/hooks/useAppendLinkInvoice"
import {
  buildOpenInvoiceUrl,
  useGenerateInvoice,
} from "@/lib/hooks/useInvoiceMutations"
import { FetchError } from "@/lib/swr-fetcher"
import type { InvoiceType, Payment } from "@/lib/types"
import {
  type InvoiceButtonAction,
  invoiceButtonState,
  typeLabel,
} from "./PaymentInvoicesSection-utils"

interface PaymentInvoicesSectionProps {
  payment: Payment
  onUpdate?: (payment: Payment) => void
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

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof FetchError) return err.message
  if (err instanceof Error) return err.message
  return fallback
}

export default function PaymentInvoicesSection({
  payment,
  onUpdate,
}: PaymentInvoicesSectionProps) {
  const linkUrlId = useId()
  const linkTypeId = useId()
  const paymentId = payment._id?.toString() ?? ""
  const isIncome = payment.type === "income"
  const invoices = getPaymentInvoices(payment)

  const { trigger: generateInvoice, isMutating: isGenerating } =
    useGenerateInvoice()
  const { trigger: appendLink, isMutating: isAppending } =
    useAppendLinkInvoice(paymentId)

  const [generateError, setGenerateError] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkType, setLinkType] = useState<AppendLinkInvoiceType>(
    isIncome ? "Receipt" : "Invoice"
  )

  const state = invoiceButtonState(invoices)
  const generateDisabled = isGenerating || !paymentId
  const linkDisabled = isAppending || !paymentId || linkUrl.trim().length === 0

  const handleGenerate = async (type: InvoiceType) => {
    setGenerateError(null)
    try {
      const data = await generateInvoice({ paymentId, type })
      onUpdate?.({
        ...payment,
        invoice: undefined,
        invoices: data.invoices,
        updatedAt: new Date(),
      })
      window.open(data.downloadUrl, "_blank")
    } catch (err) {
      console.error(`Error generating invoice: ${err}`)
      setGenerateError(extractMessage(err, "Failed to generate invoice"))
    }
  }

  const handleAppendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLinkError(null)
    const trimmed = linkUrl.trim()
    if (!trimmed) return
    try {
      await appendLink({ type: linkType, link: trimmed })
      const newEntry: InvoiceMetadata = {
        type: linkType,
        link: trimmed,
        generatedAt: new Date(),
      }
      onUpdate?.({
        ...payment,
        invoices: [...(payment.invoices ?? []), newEntry],
        updatedAt: new Date(),
      })
      setLinkUrl("")
    } catch (err) {
      console.error(`Error appending invoice link: ${err}`)
      setLinkError(extractMessage(err, "Failed to add invoice link"))
    }
  }

  return (
    <div className="space-y-4">
      {isIncome && (
        <div className="space-y-2">
          {generateError && <ErrorBanner>{generateError}</ErrorBanner>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => handleGenerate(state.primary.series)}
              disabled={generateDisabled}
              aria-busy={isGenerating}
              className={buttonClasses(state.primary)}
            >
              {isGenerating ? "Generating..." : state.primary.label}
            </button>
            <button
              type="button"
              onClick={() => handleGenerate(state.simple.series)}
              disabled={generateDisabled}
              aria-busy={isGenerating}
              className={buttonClasses(state.simple)}
            >
              {isGenerating ? "Generating..." : state.simple.label}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleAppendLink} className="space-y-2">
        {linkError && <ErrorBanner>{linkError}</ErrorBanner>}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor={linkUrlId}
              className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              {isIncome ? "Receipt link URL" : "Provider bill link URL"}
            </label>
            <input
              id={linkUrlId}
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          {!isIncome && (
            <div className="sm:w-40">
              <label
                htmlFor={linkTypeId}
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Type
              </label>
              <select
                id={linkTypeId}
                value={linkType}
                onChange={(e) =>
                  setLinkType(e.target.value as AppendLinkInvoiceType)
                }
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="Invoice">Invoice</option>
                <option value="Receipt">Receipt</option>
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={linkDisabled}
            aria-busy={isAppending}
            className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-600 dark:hover:bg-zinc-500 dark:focus:ring-offset-zinc-900"
          >
            {isAppending ? "Adding..." : "Add link"}
          </button>
        </div>
      </form>

      {invoices.length > 0 && (
        <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {invoices.map((entry, idx) => {
            const generatedAt = new Date(entry.generatedAt).toLocaleDateString(
              "es-ES"
            )
            const label = typeLabel(entry.type)
            const key = `${entry.type}-${entry.id ?? entry.link ?? idx}`
            if (entry.id) {
              return (
                <li key={key}>
                  <a
                    href={buildOpenInvoiceUrl(paymentId, entry.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {entry.id}
                  </a>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    ({label}) — {generatedAt}
                  </span>
                </li>
              )
            }
            if (entry.link) {
              return (
                <li key={key}>
                  <a
                    href={entry.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {label}
                  </a>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    — {generatedAt}
                  </span>
                </li>
              )
            }
            return (
              <li key={key} className="text-zinc-500 dark:text-zinc-400">
                {label} — {generatedAt}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
