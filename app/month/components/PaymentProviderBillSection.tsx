"use client"

import { useId, useState } from "react"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import { useSetProviderBillLink } from "@/lib/hooks/useSetProviderBillLink"
import type { Payment } from "@/lib/types"
import { extractPaymentError } from "./paymentDetailModal-utils"

interface PaymentProviderBillSectionProps {
  payment: Payment
  onUpdate?: (payment: Payment) => void
}

type Mode = "view" | "edit"

export default function PaymentProviderBillSection({
  payment,
  onUpdate,
}: PaymentProviderBillSectionProps) {
  const inputId = useId()
  const { trigger, isMutating } = useSetProviderBillLink()
  const hasLink = Boolean(payment.providerBillLink)
  const hasLegacyBlob = !hasLink && Boolean(payment.providerBillUrl)
  const [mode, setMode] = useState<Mode>(
    hasLink || hasLegacyBlob ? "view" : "edit"
  )
  const [draftUrl, setDraftUrl] = useState<string>(
    payment.providerBillLink ?? ""
  )
  const [error, setError] = useState<string | null>(null)

  const paymentId = payment._id?.toString() ?? ""

  const handleSave = async () => {
    setError(null)
    const trimmed = draftUrl.trim()
    if (!trimmed) {
      setError("URL is required")
      return
    }
    try {
      const url = new URL(trimmed)
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("invalid protocol")
      }
    } catch {
      setError("Enter a valid http(s) URL")
      return
    }
    try {
      const data = await trigger({ paymentId, url: trimmed })
      onUpdate?.({
        ...payment,
        providerBillLink: data.providerBillLink ?? undefined,
        updatedAt: new Date(),
      })
      setMode("view")
    } catch (err) {
      console.error(`Error saving provider bill link: ${err}`)
      setError(extractPaymentError(err, "Failed to save URL"))
    }
  }

  const handleClear = async () => {
    setError(null)
    try {
      await trigger({ paymentId, url: null })
      onUpdate?.({
        ...payment,
        providerBillLink: undefined,
        updatedAt: new Date(),
      })
      setDraftUrl("")
      setMode("edit")
    } catch (err) {
      console.error(`Error clearing provider bill link: ${err}`)
      setError(extractPaymentError(err, "Failed to clear URL"))
    }
  }

  const handleEdit = () => {
    setError(null)
    setDraftUrl(payment.providerBillLink ?? "")
    setMode("edit")
  }

  const handleCancelEdit = () => {
    setError(null)
    setDraftUrl(payment.providerBillLink ?? "")
    if (hasLink || hasLegacyBlob) {
      setMode("view")
    }
  }

  const handleDownloadLegacy = () => {
    window.open(`/api/invoices/${paymentId}`, "_blank", "noopener,noreferrer")
  }

  if (mode === "view" && hasLink && payment.providerBillLink) {
    return (
      <div className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Provider bill link
        </p>
        <a
          href={payment.providerBillLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-2 break-all rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          aria-label="Open provider bill in a new tab"
        >
          <svg
            className="h-4 w-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          <span className="truncate">{payment.providerBillLink}</span>
        </a>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleEdit}
            disabled={isMutating}
            aria-label="Edit provider bill URL"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Edit URL
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isMutating}
            aria-label="Clear provider bill URL"
            className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-zinc-700"
          >
            {isMutating ? "Clearing..." : "Clear"}
          </button>
        </div>
      </div>
    )
  }

  if (mode === "view" && hasLegacyBlob) {
    return (
      <div className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Provider bill uploaded
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadLegacy}
            aria-label="Download provider bill"
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
            Download Provider Bill
          </button>
          <button
            type="button"
            onClick={handleEdit}
            aria-label="Override provider bill with URL"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Override with URL
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Provider bill URL
        </label>
        <input
          id={inputId}
          type="url"
          inputMode="url"
          maxLength={2048}
          placeholder="https://provider.example/bill.pdf"
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          disabled={isMutating}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isMutating}
          aria-label="Save provider bill URL"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          {isMutating ? "Saving..." : "Save URL"}
        </button>
        {(hasLink || hasLegacyBlob) && (
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isMutating}
            aria-label="Cancel editing provider bill URL"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
