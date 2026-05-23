"use client"

import { ErrorBanner } from "@/app/components/ErrorBanner"
import type { Payment } from "@/lib/types"

interface PaymentProviderBillSectionProps {
  idPrefix: string
  payment: Payment
  uploadError: string | null
  isUploading: boolean
  fileInputRef: React.Ref<HTMLInputElement>
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDownload: () => void
}

export default function PaymentProviderBillSection({
  idPrefix,
  payment,
  uploadError,
  isUploading,
  fileInputRef,
  onUpload,
  onDownload,
}: PaymentProviderBillSectionProps) {
  if (payment.providerBillUrl) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Provider bill uploaded
        </p>
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
          Download Provider Bill
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {uploadError && <ErrorBanner>{uploadError}</ErrorBanner>}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={onUpload}
          disabled={isUploading}
          className="hidden"
          id={`${idPrefix}-provider-bill-upload`}
        />
        <label
          htmlFor={`${idPrefix}-provider-bill-upload`}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {isUploading ? "Uploading..." : "Upload Provider Bill (PDF)"}
        </label>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Max file size: 10MB. Only PDF files allowed.
      </p>
    </div>
  )
}
