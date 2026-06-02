"use client"

import { useEffect, useMemo, useState } from "react"
import ClientSelector from "@/app/components/ClientSelector"
import { Modal } from "@/app/components/Modal"
import type { Client, ClientFormData } from "@/lib/domain/entities/client"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"
import {
  useCreateClient,
  useUpdateClient,
} from "@/lib/hooks/useClientMutations"
import { useClients } from "@/lib/hooks/useClients"
import { extractApiError } from "./wordpress-view-utils"

interface WordpressBillingClientModalProps {
  order: WordPressOrder | null
  onClose: () => void
  onConfirmed?: (message: string) => void
}

interface ClientDiffRow {
  field: "name" | "phone" | "email"
  label: string
  currentValue: string
  nextValue: string
}

function normalizeField(value: string | undefined): string {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : "-"
}

function toOptional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function getBillingName(order: WordPressOrder): string {
  return `${order.billing.first_name} ${order.billing.last_name}`.trim()
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

function getBillingPayload(
  order: WordPressOrder
): Pick<ClientFormData, "name" | "phone" | "email"> {
  return {
    name: getBillingName(order),
    phone: toOptional(order.billing.phone),
    email: toOptional(order.billing.email),
  }
}

export function WordpressBillingClientModal({
  order,
  onClose,
  onConfirmed,
}: WordpressBillingClientModalProps) {
  const { trigger: createClient, isMutating: isCreatingClient } =
    useCreateClient()
  const { trigger: updateClient, isMutating: isUpdatingClient } =
    useUpdateClient()

  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    undefined
  )
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [hasManualSelection, setHasManualSelection] = useState(false)
  const [selectedDiffFields, setSelectedDiffFields] = useState<
    Record<"name" | "phone" | "email", boolean>
  >({
    name: false,
    phone: false,
    email: false,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!order) return
    setSelectedClientId(undefined)
    setSelectedClient(null)
    setHasManualSelection(false)
    setErrorMessage(null)
  }, [order])

  const billingName = useMemo(
    () => (order ? getBillingName(order) : ""),
    [order]
  )

  const { clients: autoMatchedClients } = useClients({
    search: billingName,
    page: 1,
    pageSize: 20,
  })

  useEffect(() => {
    if (!order || hasManualSelection || selectedClientId || selectedClient)
      return

    const billingNameNormalized = normalizeName(getBillingName(order))
    const exactMatch = autoMatchedClients.find((client) => {
      if (!client._id) return false
      return normalizeName(client.name) === billingNameNormalized
    })

    if (!exactMatch?._id) return

    setSelectedClientId(exactMatch._id)
    setSelectedClient(exactMatch)
  }, [
    order,
    hasManualSelection,
    selectedClientId,
    selectedClient,
    autoMatchedClients,
  ])

  const billingPayload = useMemo(
    () => (order ? getBillingPayload(order) : null),
    [order]
  )

  const clientDiff = useMemo<ClientDiffRow[]>(() => {
    if (!selectedClient || !billingPayload) return []

    const rows = [
      {
        field: "name" as const,
        label: "Name",
        currentValue: normalizeField(selectedClient.name),
        nextValue: normalizeField(billingPayload.name),
      },
      {
        field: "phone" as const,
        label: "Phone",
        currentValue: normalizeField(selectedClient.phone),
        nextValue: normalizeField(billingPayload.phone),
      },
      {
        field: "email" as const,
        label: "Email",
        currentValue: normalizeField(selectedClient.email),
        nextValue: normalizeField(billingPayload.email),
      },
    ]

    return rows.filter((row) => row.currentValue !== row.nextValue)
  }, [selectedClient, billingPayload])

  useEffect(() => {
    if (!selectedClient) {
      setSelectedDiffFields({ name: false, phone: false, email: false })
      return
    }

    const next: Record<"name" | "phone" | "email", boolean> = {
      name: false,
      phone: false,
      email: false,
    }

    for (const row of clientDiff) {
      next[row.field] = true
    }

    setSelectedDiffFields(next)
  }, [selectedClient, clientDiff])

  const hasDiffChanges = clientDiff.length > 0
  const selectedDiffCount = clientDiff.filter(
    (row) => selectedDiffFields[row.field]
  ).length
  const isSubmitting = isCreatingClient || isUpdatingClient

  const confirmLabel = selectedClient
    ? "Confirm update client"
    : "Confirm create client"

  const pendingLabel = selectedClient ? "Updating client…" : "Creating client…"

  const handleConfirm = async () => {
    if (!order || !billingPayload) return

    setErrorMessage(null)

    try {
      if (!selectedClient?._id) {
        await createClient({
          clientType: "individual",
          ...billingPayload,
        })
        onConfirmed?.(`Client created from order #${order.id}`)
        onClose()
        return
      }

      const updates: {
        id: string
        name?: string
        phone?: string
        email?: string
      } = { id: selectedClient._id }

      if (selectedDiffFields.name) {
        updates.name = billingPayload.name
      }
      if (selectedDiffFields.phone) {
        updates.phone = billingPayload.phone
      }
      if (selectedDiffFields.email) {
        updates.email = billingPayload.email
      }

      if (Object.keys(updates).length === 1) {
        setErrorMessage("Select at least one field to update.")
        return
      }

      await updateClient(updates)
      onConfirmed?.(`Client updated from order #${order.id}`)
      onClose()
    } catch (error) {
      setErrorMessage(extractApiError(error, "Failed to save client"))
    }
  }

  const isConfirmDisabled =
    isSubmitting ||
    (selectedClient ? !hasDiffChanges || selectedDiffCount === 0 : false)

  return (
    <Modal
      isOpen={order !== null}
      onClose={onClose}
      title={
        order
          ? `Import billing into clients - Order #${order.id}`
          : "Import billing into clients"
      }
      maxWidth="lg"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void handleConfirm()
            }}
            disabled={isConfirmDisabled}
            aria-busy={isSubmitting}
            className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-900"
          >
            {isSubmitting ? pendingLabel : confirmLabel}
          </button>
        </div>
      }
    >
      {order && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Billing data from WordPress
            </h3>
            <div className="mt-2 space-y-1 text-sm text-zinc-900 dark:text-zinc-100">
              <p>{getBillingName(order)}</p>
              <p>{normalizeField(order.billing.phone)}</p>
              <p>{normalizeField(order.billing.email)}</p>
            </div>
          </div>

          <ClientSelector
            value={selectedClientId}
            initialQuery={getBillingName(order)}
            selectedClientName={selectedClient?.name}
            onChange={(clientId) => {
              setHasManualSelection(true)
              setSelectedClientId(clientId)
            }}
            onSelectClient={(client) => {
              setHasManualSelection(true)
              setSelectedClient(client)
            }}
            label="Select an existing client to update (optional)"
          />

          {selectedClient && hasDiffChanges && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  Differences to apply
                </h3>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {clientDiff.map((row) => (
                  <div key={row.field} className="space-y-3 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">
                        {row.label}
                      </p>
                      <label className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                        <input
                          type="checkbox"
                          checked={selectedDiffFields[row.field]}
                          onChange={(event) => {
                            setSelectedDiffFields((current) => ({
                              ...current,
                              [row.field]: event.target.checked,
                            }))
                          }}
                          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span>Store</span>
                      </label>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800/40">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          Current
                        </p>
                        <p className="mt-1 text-sm text-zinc-600 [overflow-wrap:anywhere] dark:text-zinc-300">
                          {row.currentValue}
                        </p>
                      </div>
                      <div className="rounded-md border border-blue-200 bg-blue-50 p-2 dark:border-blue-900/60 dark:bg-blue-950/20">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                          Incoming
                        </p>
                        <p className="mt-1 text-sm text-zinc-900 [overflow-wrap:anywhere] dark:text-zinc-100">
                          {row.nextValue}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedClient && (
            <p className="text-sm text-green-600 dark:text-green-300 ">
              Confirm will create a new client as Individual using billing name,
              phone and email.
            </p>
          )}

          {selectedClient && !hasDiffChanges && (
            <p className="text-sm text-yellow-600 dark:text-yellow-300">
              Selected client already matches billing name, phone and email.
            </p>
          )}

          {selectedClient && hasDiffChanges && selectedDiffCount === 0 && (
            <p className="text-sm text-red-600 dark:text-red-300">
              Select at least one mismatched field to update.
            </p>
          )}

          {errorMessage && (
            <p
              className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
