import { TrashIcon } from "@/app/components/icons/TrashIcon"
import type { InvoiceMetadata } from "@/lib/domain/entities/payment"
import { buildOpenInvoiceUrl } from "@/lib/hooks/useInvoiceMutations"
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
          const link = entry.link
          return (
            <li key={key} className="flex items-center gap-2">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {label}
              </a>
              <span className="text-zinc-500 dark:text-zinc-400">
                — {generatedAt}
              </span>
              <button
                type="button"
                onClick={() => onRemoveLink(link)}
                disabled={isRemoving || !paymentId}
                aria-label={`Remove ${label} link`}
                className="ml-auto inline-flex items-center rounded-md p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-950"
              >
                <TrashIcon />
              </button>
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
  )
}
