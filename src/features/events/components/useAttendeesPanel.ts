"use client"

import { useMemo, useState } from "react"
import { useCreateClient } from "@/features/clients/hooks/useClientMutations"
import { useClients } from "@/features/clients/hooks/useClients"
import {
  isInvoiceGuardError,
  useAddEventAttendee,
  useGenerateEventPayment,
  useRemoveEventAttendee,
  useUpdateEventAttendee,
} from "@/features/events/hooks/useEventMutations"
import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import type { PaymentMethod } from "@/lib/domain/entities/payment"
import {
  buildAttendeeEmailsString,
  extractErrorMessage,
} from "./attendeesPanel-utils"
import { totalSeats } from "./eventsUi"
import { useAttendeePaymentPreview } from "./useAttendeePaymentPreview"

interface InvoiceGuardState {
  invoiceType: string
  invoiceId: string
}

interface UseAttendeesPanelArgs {
  event: Event
  onActionSuccess: (message: string) => void
  onActionError: (message: string) => void
}

/**
 * Encapsulates attendee CRUD, client creation/editing, payment generation,
 * email-copy, and payment-preview state for the attendees panel.
 */
export function useAttendeesPanel({
  event,
  onActionSuccess,
  onActionError,
}: UseAttendeesPanelArgs) {
  const eventId = event._id
  const {
    openingPaymentId,
    selectedPayment,
    setSelectedPayment,
    handleOpenPayment,
    handleSelectedPaymentDeleted,
  } = useAttendeePaymentPreview({ onActionError })
  const [pendingPayment, setPendingPayment] = useState<string | null>(null)
  const [savingClientId, setSavingClientId] = useState<string | null>(null)
  const [invoiceGuard, setInvoiceGuard] = useState<InvoiceGuardState | null>(
    null
  )
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [selectorResetKey, setSelectorResetKey] = useState(0)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)

  // 100 is the API max page size; sufficient for the lookup use-case in this POC.
  const { clients } = useClients({ pageSize: 100 })
  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clients) {
      if (c._id) map.set(c._id, c.name)
    }
    return map
  }, [clients])

  const editingClient = useMemo(
    () =>
      editingClientId
        ? clients.find((c) => c._id === editingClientId)
        : undefined,
    [clients, editingClientId]
  )

  const emailsString = useMemo(
    () => buildAttendeeEmailsString(event.attendees, clients),
    [event.attendees, clients]
  )
  const hasEmails = emailsString.length > 0

  const addMutation = useAddEventAttendee()
  const updateMutation = useUpdateEventAttendee()
  const removeMutation = useRemoveEventAttendee()
  const generateOne = useGenerateEventPayment()
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
          invoiceType: guard.invoiceType,
          invoiceId: guard.invoiceId,
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

  const handleGenerateOne = async (
    clientId: string,
    paymentMethod: PaymentMethod
  ) => {
    if (!eventId) return
    setPendingPayment(clientId)
    try {
      const result = await generateOne.trigger({
        eventId,
        clientId,
        paymentMethod,
      })
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

  return {
    clientNameById,
    editingClient,
    hasEmails,
    emailsString,
    seats,
    remaining,
    pendingPayment,
    savingClientId,
    openingPaymentId,
    selectedPayment,
    invoiceGuard,
    isCreatingClient,
    selectorResetKey,
    handleEditClient: setEditingClientId,
    closeEditClient: () => setEditingClientId(null),
    closeInvoiceGuard: () => setInvoiceGuard(null),
    setSelectedPayment,
    handleClientChange,
    handleCreateClient,
    commitSeats,
    handleRemove,
    handleGenerateOne,
    handleOpenPayment,
    handleSelectedPaymentDeleted,
  }
}
