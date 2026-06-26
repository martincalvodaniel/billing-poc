"use client"

import { useEffect, useId, useState } from "react"
import ClientSelector from "@/components/shared/ClientSelector"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Modal } from "@/components/ui/Modal"
import NumberStepperInput from "@/components/ui/NumberStepperInput"
import RequiredAsterisk from "@/components/ui/RequiredAsterisk"
import { useCreateWordpressCoupon } from "@/features/wordpress/hooks/useWordpressCouponMutations"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { Client } from "@/lib/domain/entities/client"
import { getDefaultCouponExpiryDate } from "./wordpress-coupon-utils"
import { extractApiError } from "./wordpress-view-utils"

interface WordpressCouponCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (message: string) => void
}

export function WordpressCouponCreateModal({
  isOpen,
  onClose,
  onCreated,
}: WordpressCouponCreateModalProps) {
  function buildClientDescription(client: Client) {
    return [client.email?.trim(), client.phone?.trim()]
      .filter((value) => Boolean(value))
      .join(" - ")
  }
  const id = useId()
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    undefined
  )
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [dateExpires, setDateExpires] = useState(() =>
    getDefaultCouponExpiryDate()
  )
  const { trigger, isMutating, error, reset } = useCreateWordpressCoupon()

  useEffect(() => {
    if (!isOpen) return
    setSelectedClientId(undefined)
    setDescription("")
    setAmount("")
    setDateExpires(getDefaultCouponExpiryDate())
    reset()
  }, [isOpen, reset])

  const handleClose = useStableCallback(() => {
    if (!isMutating) onClose()
  })
  const handleAmountChange = useStableCallback((value: string) => {
    setAmount(value)
  })
  const handleClientChange = useStableCallback((clientId?: string) => {
    setSelectedClientId(clientId)
  })
  const handleSelectClient = useStableCallback((client: Client | null) => {
    if (!client) return
    setDescription(buildClientDescription(client))
  })
  const handleDescriptionChange = useStableCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDescription(event.target.value)
    }
  )
  const handleExpiryChange = useStableCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDateExpires(event.target.value)
    }
  )
  const handleSubmit = useStableCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        const result = await trigger({
          description: description.trim(),
          amount,
          dateExpires,
        })
        onCreated(`Coupon ${result.coupon.code} created`)
        onClose()
      } catch {
        // The mutation error is rendered below.
      }
    }
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create WordPress coupon"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <ErrorBanner bordered>
            {extractApiError(error, "Failed to create WordPress coupon")}
          </ErrorBanner>
        ) : null}

        <div>
          <ClientSelector
            value={selectedClientId}
            onChange={handleClientChange}
            onSelectClient={handleSelectClient}
            label="Client (optional)"
          />
        </div>

        <div>
          <label
            htmlFor={`${id}-description`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Description
            <RequiredAsterisk />
          </label>
          <input
            id={`${id}-description`}
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            disabled={isMutating}
            required
            aria-required="true"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-offset-zinc-900"
          />
        </div>

        <div>
          <label
            htmlFor={`${id}-amount`}
            className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Price including 21% tax (€)
            <RequiredAsterisk />
          </label>
          <NumberStepperInput
            id={`${id}-amount`}
            name="amount"
            value={amount}
            onValueChange={handleAmountChange}
            ariaLabel="Coupon price including tax"
            min={5}
            step={5}
            inputMode="decimal"
            emptyStepBase={0}
            disabled={isMutating}
            required
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            WooCommerce receives the corresponding price without tax.
          </p>
        </div>

        <div>
          <label
            htmlFor={`${id}-date-expires`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Date expires
            <RequiredAsterisk />
          </label>
          <input
            id={`${id}-date-expires`}
            type="date"
            value={dateExpires}
            onChange={handleExpiryChange}
            disabled={isMutating}
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-offset-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            The coupon expires at 00:00 in your browser&apos;s local time.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isMutating}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isMutating}
            aria-busy={isMutating}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-900"
          >
            {isMutating ? "Creating..." : "Create coupon"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
