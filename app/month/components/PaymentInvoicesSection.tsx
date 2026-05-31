"use client"

import { useState } from "react"
import { ConfirmDialog } from "@/app/components/ConfirmDialog"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import type { InvoiceType, Payment } from "@/lib/domain/entities/payment"
import {
  getPaymentInvoices,
  type InvoiceMetadata,
} from "@/lib/domain/entities/payment"
import {
  type AppendLinkInvoiceType,
  useAppendLinkInvoice,
} from "@/lib/hooks/useAppendLinkInvoice"
import { useGenerateInvoice } from "@/lib/hooks/useInvoiceMutations"
import { useRemoveLinkInvoice } from "@/lib/hooks/useRemoveLinkInvoice"
import { FetchError } from "@/lib/swr-fetcher"
import PaymentInvoiceLinkForm from "./PaymentInvoiceLinkForm"
import PaymentInvoicesList from "./PaymentInvoicesList"
import {
  type InvoiceButtonAction,
  invoiceButtonState,
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
  const paymentId = payment._id ?? ""
  const isIncome = payment.type === "income"
  const invoices = getPaymentInvoices(payment)

  const { trigger: generateInvoice, isMutating: isGenerating } =
    useGenerateInvoice()
  const { trigger: appendLink, isMutating: isAppending } =
    useAppendLinkInvoice(paymentId)
  const { trigger: removeLink, isMutating: isRemoving } =
    useRemoveLinkInvoice(paymentId)

  const [generateError, setGenerateError] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkType, setLinkType] = useState<AppendLinkInvoiceType>("Invoice")
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [pendingRemoveLink, setPendingRemoveLink] = useState<string | null>(
    null
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

  const handleRemoveLink = (link: string) => {
    setPendingRemoveLink(link)
    setShowRemoveConfirm(true)
  }

  const handleConfirmRemoveLink = async () => {
    if (!paymentId || !pendingRemoveLink) return
    setRemoveError(null)
    try {
      await removeLink({ link: pendingRemoveLink })
      onUpdate?.({
        ...payment,
        invoices: (payment.invoices ?? []).filter(
          (i) => !(i.link === pendingRemoveLink && !i.id)
        ),
        updatedAt: new Date(),
      })
      setShowRemoveConfirm(false)
      setPendingRemoveLink(null)
    } catch (err) {
      console.error(`Error removing invoice link: ${err}`)
      setRemoveError(extractMessage(err, "Failed to remove invoice link"))
    }
  }

  return (
    <div className="space-y-4">
      <PaymentInvoicesList
        invoices={invoices}
        paymentId={paymentId}
        isRemoving={isRemoving}
        onRemoveLink={handleRemoveLink}
      />
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

      <PaymentInvoiceLinkForm
        linkUrl={linkUrl}
        linkType={linkType}
        linkError={linkError}
        isAppending={isAppending}
        disabled={linkDisabled}
        onUrlChange={setLinkUrl}
        onTypeChange={setLinkType}
        onSubmit={handleAppendLink}
      />

      {removeError && <ErrorBanner>{removeError}</ErrorBanner>}

      <ConfirmDialog
        isOpen={showRemoveConfirm}
        title="Delete invoice link"
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        variant="danger"
        isPending={isRemoving}
        error={removeError}
        onCancel={() => {
          if (isRemoving) return
          setShowRemoveConfirm(false)
          setPendingRemoveLink(null)
          setRemoveError(null)
        }}
        onConfirm={() => {
          void handleConfirmRemoveLink()
        }}
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Delete this invoice link?
        </p>
      </ConfirmDialog>
    </div>
  )
}
