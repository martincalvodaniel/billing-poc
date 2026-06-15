import { TrashIcon } from "@/components/ui/icons/TrashIcon"
import { buildOpenInvoiceUrl } from "@/features/invoices/hooks/useInvoiceMutations"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { InvoiceMetadata } from "@/lib/domain/entities/payment"
import { typeLabel } from "./PaymentInvoicesSection-utils"

interface PaymentInvoicesListProps {
  invoices: InvoiceMetadata[]
  paymentId: string
  isRemoving: boolean
  onRemoveLink: (link: string) => void
}
export default function PaymentInvoicesList({
  invoices,
  paymentId,
  isRemoving,
  onRemoveLink,
}: PaymentInvoicesListProps) {
  if (invoices.length === 0) return null
  return (
    <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
      {invoices.map((entry, index) => (
        <PaymentInvoiceItem
          key={`${entry.type}-${entry.id ?? entry.link ?? index}`}
          entry={entry}
          paymentId={paymentId}
          isRemoving={isRemoving}
          onRemoveLink={onRemoveLink}
        />
      ))}
    </ul>
  )
}

function PaymentInvoiceItem({
  entry,
  paymentId,
  isRemoving,
  onRemoveLink,
}: {
  entry: InvoiceMetadata
  paymentId: string
  isRemoving: boolean
  onRemoveLink: (link: string) => void
}) {
  const generatedAt = new Date(entry.generatedAt).toLocaleDateString("es-ES")
  const label = typeLabel(entry.type)
  const handleRemove = useStableCallback(() => {
    if (entry.link) onRemoveLink(entry.link)
  })

  if (entry.id) {
    return (
      <li>
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
  if (!entry.link) {
    return (
      <li className="text-zinc-500 dark:text-zinc-400">
        {label} — {generatedAt}
      </li>
    )
  }
  return (
    <li className="flex items-center gap-2">
      <a
        href={entry.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        {label}
      </a>
      <span className="text-zinc-500 dark:text-zinc-400">— {generatedAt}</span>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isRemoving || !paymentId}
        aria-label={`Remove ${label} link`}
        className="ml-auto inline-flex items-center rounded-md p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-950"
      >
        <TrashIcon />
      </button>
    </li>
  )
}
