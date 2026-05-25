"use client"

import { useRouter } from "next/navigation"
import { useId, useMemo, useState } from "react"
import { useSWRConfig } from "swr"
import ClientSelector from "@/app/components/ClientSelector"
import { EmptyState } from "@/app/components/EmptyState"
import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import { useCreateClient } from "@/lib/hooks/useClientMutations"
import { useClients } from "@/lib/hooks/useClients"
import {
  isInvoiceGuardError,
  useAddEventAttendee,
  useGenerateEventPayment,
  useGenerateEventPayments,
  useRemoveEventAttendee,
  useUpdateEventAttendee,
} from "@/lib/hooks/useEventMutations"
import {
  buildPaymentKey,
  buildPaymentUrl,
  type PaymentResponse,
} from "@/lib/hooks/usePayments"
import { fetcher } from "@/lib/swr-fetcher"
import AttendeeRow from "./AttendeeRow"
import { extractErrorMessage } from "./attendeesPanel-utils"
import CapacityBar from "./CapacityBar"
import { totalSeats } from "./eventsUi"
import InvoiceGuardModal from "./InvoiceGuardModal"

interface AttendeesPanelProps {
  event: Event
  onActionSuccess: (message: string) => void
  onActionError: (message: string) => void
}

interface InvoiceGuardState {
  invoiceSeries: string
  invoiceNumber: number
}

export default function AttendeesPanel({
  event,
  onActionSuccess,
  onActionError,
}: AttendeesPanelProps) {
  const id = useId()
  const eventId = event._id
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const [pendingPayment, setPendingPayment] = useState<string | null>(null)
  const [pendingBulk, setPendingBulk] = useState(false)
  const [savingClientId, setSavingClientId] = useState<string | null>(null)
  const [openingPaymentId, setOpeningPaymentId] = useState<string | null>(null)
  const [invoiceGuard, setInvoiceGuard] = useState<InvoiceGuardState | null>(
    null
  )
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [selectorResetKey, setSelectorResetKey] = useState(0)

  // 100 is the API max page size; sufficient for the lookup use-case in this POC.
  const { clients } = useClients({ pageSize: 100 })
  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clients) {
      if (c._id) map.set(String(c._id), c.name)
    }
    return map
  }, [clients])

  const addMutation = useAddEventAttendee()
  const updateMutation = useUpdateEventAttendee()
  const removeMutation = useRemoveEventAttendee()
  const generateOne = useGenerateEventPayment()
  const generateAll = useGenerateEventPayments()
  const createClient = useCreateClient()

  const seats = totalSeats(event.attendees)
  const remaining =
    event.maxAttendees !== undefined ? event.maxAttendees - seats : undefined

  const handleClientChange = async (clientId: string) => {
    if (!eventId || addMutation.isMutating) return
    try {
      await addMutation.trigger({ eventId, clientId, seats: 1 })
      onActionSuccess("Attendee added")
      setSelectorResetKey((k) => k + 1)
    } catch (error) {
      onActionError(extractErrorMessage(error, "Failed to add attendee"))
    }
  }

  const handleCreateClient = async (name: string) => {
    if (!eventId) return
    setIsCreatingClient(true)
    try {
      const { id: newClientId } = await createClient.trigger({
        name,
        clientType: "individual",
      })
      await addMutation.trigger({
        eventId,
        clientId: newClientId,
        seats: 1,
      })
      onActionSuccess(`Client "${name}" created and added`)
      setSelectorResetKey((k) => k + 1)
    } catch (error) {
      onActionError(extractErrorMessage(error, "Failed to create client"))
    } finally {
      setIsCreatingClient(false)
    }
  }

  const commitSeats = async (
    attendee: EventAttendee,
    nextSeatsRaw: string,
    revert: () => void
  ) => {
    if (!eventId) return
    const nextSeats = Number(nextSeatsRaw)
    if (!Number.isFinite(nextSeats) || nextSeats < 1) {
      onActionError("Seats must be at least 1")
      revert()
      return
    }
    if (nextSeats === attendee.seats) return
    setSavingClientId(attendee.clientId)
    try {
      await updateMutation.trigger({
        eventId,
        clientId: attendee.clientId,
        seats: nextSeats,
      })
      onActionSuccess("Attendee updated")
    } catch (error) {
      const guard = isInvoiceGuardError(error)
      if (guard) {
        setInvoiceGuard({
          invoiceSeries: guard.invoiceSeries,
          invoiceNumber: guard.invoiceNumber,
        })
      } else {
        onActionError(extractErrorMessage(error, "Failed to update attendee"))
      }
      revert()
    } finally {
      setSavingClientId(null)
    }
  }

  const handleRemove = async (clientId: string) => {
    if (!eventId) return
    try {
      await removeMutation.trigger({ eventId, clientId })
      onActionSuccess("Attendee removed")
    } catch (error) {
      onActionError(extractErrorMessage(error, "Failed to remove attendee"))
    }
  }

  const handleGenerateOne = async (clientId: string) => {
    if (!eventId) return
    setPendingPayment(clientId)
    try {
      const result = await generateOne.trigger({ eventId, clientId })
      if (result.alreadyExists) {
        onActionSuccess("Payment already exists for this attendee")
      } else {
        onActionSuccess("Payment generated")
      }
    } catch (error) {
      onActionError(extractErrorMessage(error, "Failed to generate payment"))
    } finally {
      setPendingPayment(null)
    }
  }

  const handleGenerateAll = async () => {
    if (!eventId) return
    setPendingBulk(true)
    try {
      const result = await generateAll.trigger({ eventId })
      onActionSuccess(
        `${result.created.length} created, ${result.skipped.length} skipped`
      )
    } catch (error) {
      onActionError(extractErrorMessage(error, "Failed to generate payments"))
    } finally {
      setPendingBulk(false)
    }
  }

  const handleOpenPayment = async (paymentId: string) => {
    setOpeningPaymentId(paymentId)
    try {
      const data = await mutate<PaymentResponse>(
        buildPaymentKey(paymentId),
        fetcher<PaymentResponse>(buildPaymentUrl(paymentId)),
        { revalidate: false, populateCache: true }
      )
      if (!data) throw new Error("Payment not found")
      const { date } = data.payment
      const year = date.slice(0, 4)
      const month = parseInt(date.slice(5, 7), 10)
      router.push(
        `/month?year=${year}&month=${month}&payment=${encodeURIComponent(paymentId)}`
      )
    } catch (error) {
      onActionError(extractErrorMessage(error, "Failed to open payment"))
      setOpeningPaymentId(null)
    }
  }

  return (
    <section className="space-y-3">
      <CapacityBar used={seats} max={event.maxAttendees} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Attendees
        </h3>
        {event.attendees.length > 0 && (
          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={pendingBulk}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingBulk ? "Generating…" : "Generate all payments"}
          </button>
        )}
      </div>

      {event.attendees.length === 0 ? (
        <EmptyState>No attendees yet.</EmptyState>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {event.attendees.map((attendee) => {
            const name =
              clientNameById.get(attendee.clientId) ?? "Unknown client"
            const isSaving = savingClientId === attendee.clientId
            const isGenerating = pendingPayment === attendee.clientId
            const hasPayment = Boolean(attendee.paymentId)
            return (
              <AttendeeRow
                key={attendee.clientId}
                rowIdPrefix={id}
                attendee={attendee}
                name={name}
                isSaving={isSaving}
                isGenerating={isGenerating}
                hasPayment={hasPayment}
                isOpeningPayment={openingPaymentId === attendee.paymentId}
                onCommit={commitSeats}
                onGenerate={handleGenerateOne}
                onRemove={handleRemove}
                onOpenPayment={handleOpenPayment}
              />
            )
          })}
        </ul>
      )}

      <div className="rounded-md border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Add attendee
          {remaining !== undefined && (
            <span className="ml-2 font-normal normal-case">
              ({remaining} seat{remaining === 1 ? "" : "s"} remaining)
            </span>
          )}
        </p>
        <ClientSelector
          key={selectorResetKey}
          onChange={(clientId) => {
            if (clientId) void handleClientChange(clientId)
          }}
          label="Client"
          required
          onCreateClient={(name) => void handleCreateClient(name)}
          isCreating={isCreatingClient}
        />
      </div>

      {invoiceGuard && (
        <InvoiceGuardModal
          isOpen
          onClose={() => setInvoiceGuard(null)}
          invoiceSeries={invoiceGuard.invoiceSeries}
          invoiceNumber={invoiceGuard.invoiceNumber}
        />
      )}
    </section>
  )
}
