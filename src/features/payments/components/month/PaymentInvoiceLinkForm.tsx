import { useId } from "react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import type { AppendLinkInvoiceType } from "@/features/invoices/hooks/useAppendLinkInvoice"

interface PaymentInvoiceLinkFormProps {
  linkUrl: string
  linkType: AppendLinkInvoiceType
  linkError: string | null
  isAppending: boolean
  disabled: boolean
  onUrlChange: (value: string) => void
  onTypeChange: (value: AppendLinkInvoiceType) => void
  onSubmit: (e: React.FormEvent) => void
}
export default function PaymentInvoiceLinkForm({
  linkUrl,
  linkType,
  linkError,
  isAppending,
  disabled,
  onUrlChange,
  onTypeChange,
  onSubmit,
}: PaymentInvoiceLinkFormProps) {
  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    return onUrlChange(e.target.value)
  }
  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    return onTypeChange(e.target.value as AppendLinkInvoiceType)
  }
  const linkUrlId = useId()
  const linkTypeId = useId()
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {linkError ? <ErrorBanner>{linkError}</ErrorBanner> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor={linkUrlId}
            className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Link URL
          </label>
          <input
            id={linkUrlId}
            type="url"
            value={linkUrl}
            onChange={handleUrlChange}
            placeholder="https://..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
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
            onChange={handleTypeChange}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="Invoice">Invoice</option>
            <option value="Receipt">Receipt</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={disabled}
          aria-busy={isAppending}
          className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-600 dark:hover:bg-zinc-500 dark:focus:ring-offset-zinc-900"
        >
          {isAppending ? "Adding..." : "Add link"}
        </button>
      </div>
    </form>
  )
}
