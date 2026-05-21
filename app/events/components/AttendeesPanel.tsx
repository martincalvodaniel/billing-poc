"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import ClientSelector from "@/app/components/ClientSelector"
import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import { useClients } from "@/lib/hooks/useClients"
import {
  isInvoiceGuardError,
  useAddEventAttendee,
  useGenerateEventPayment,
  useGenerateEventPayments,
  useRemoveEventAttendee,
  useUpdateEventAttendee,
} from "@/lib/hooks/useEventMutations"
import { FetchError } from "@/lib/swr-fetcher"
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

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchError) {
    const info = error.info as { error?: string } | null
    if (info && typeof info.error === "string") return info.error
    return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export default function AttendeesPanel({
  event,
  onActionSuccess,
  onActionError,
}: AttendeesPanelProps) {
  const id = useId()
  const eventId = event._id
  const [addClientId, setAddClientId] = useState<string | undefined>(undefined)
  const [addSeats, setAddSeats] = useState<string>("1")
  const [pendingPayment, setPendingPayment] = useState<string | null>(null)
  const [pendingBulk, setPendingBulk] = useState(false)
  const [savingClientId, setSavingClientId] = useState<string | null>(null)
  const [invoiceGuard, setInvoiceGuard] = useState<InvoiceGuardState | null>(
    null
  )

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

  const seats = totalSeats(event.attendees)
  const remaining =
    event.maxAttendees !== undefined ? event.maxAttendees - seats : undefined

  const canAdd =
    eventId !== undefined &&
    addClientId !== undefined &&
    Number(addSeats) >= 1 &&
    !addMutation.isMutating

  const handleAdd = async () => {
    if (!eventId || !addClientId) return
    const seatsNum = Number(addSeats)
    if (!Number.isFinite(seatsNum) || seatsNum < 1) {
      onActionError("Seats must be at least 1")
      return
    }
    try {
      await addMutation.trigger({
        eventId,
        clientId: addClientId,
        seats: seatsNum,
      })
      setAddClientId(undefined)
      setAddSeats("1")
      onActionSuccess("Attendee added")
    } catch (error) {
      onActionError(extractErrorMessage(error, "Failed to add attendee"))
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No attendees yet.
        </p>
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
                onCommit={commitSeats}
                onGenerate={handleGenerateOne}
                onRemove={handleRemove}
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
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <ClientSelector
            value={addClientId}
            onChange={(clientId) => setAddClientId(clientId)}
            label="Client"
            required
          />
          <div className="space-y-1">
            <label
              htmlFor={`${id}-add-seats`}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Seats
            </label>
            <input
              type="number"
              id={`${id}-add-seats`}
              value={addSeats}
              onChange={(event) => setAddSeats(event.currentTarget.value)}
              min={1}
              step={1}
              aria-label="Seats to add"
              className="w-20 rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addMutation.isMutating ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
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

interface AttendeeRowProps {
  rowIdPrefix: string
  attendee: EventAttendee
  name: string
  isSaving: boolean
  isGenerating: boolean
  hasPayment: boolean
  onCommit: (
    attendee: EventAttendee,
    nextSeats: string,
    revert: () => void
  ) => Promise<void>
  onGenerate: (clientId: string) => void
  onRemove: (clientId: string) => void
}

function AttendeeRow({
  rowIdPrefix,
  attendee,
  name,
  isSaving,
  isGenerating,
  hasPayment,
  onCommit,
  onGenerate,
  onRemove,
}: AttendeeRowProps) {
  const [seatsValue, setSeatsValue] = useState<string>(String(attendee.seats))
  const lastSyncedRef = useRef<number>(attendee.seats)

  // Keep the local value in sync when the upstream attendee.seats changes
  // (e.g. after a successful mutation triggers a re-render).
  useEffect(() => {
    if (attendee.seats !== lastSyncedRef.current) {
      lastSyncedRef.current = attendee.seats
      setSeatsValue(String(attendee.seats))
    }
  }, [attendee.seats])

  const revert = () => {
    setSeatsValue(String(attendee.seats))
  }

  const handleCommit = () => {
    if (seatsValue === String(attendee.seats)) return
    void onCommit(attendee, seatsValue, revert)
  }

  // Commit when focus leaves the stepper region entirely.
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    handleCommit()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCommit()
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p
          className="truncate font-medium text-zinc-900 dark:text-zinc-100"
          title={attendee.clientId}
        >
          {name}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <label
            htmlFor={`${rowIdPrefix}-seats-${attendee.clientId}`}
            className="sr-only"
          >
            Seats for {name}
          </label>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: focus/keyboard handlers on a wrapper to detect blur/Enter on the seats input */}
          <div className="w-20" onBlur={handleBlur} onKeyDown={handleKeyDown}>
            <input
              type="number"
              id={`${rowIdPrefix}-seats-${attendee.clientId}`}
              value={seatsValue}
              onChange={(event) => setSeatsValue(event.currentTarget.value)}
              min={1}
              step={1}
              disabled={isSaving}
              aria-label={`Seats for ${name}`}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          {isSaving && <span aria-live="polite">Saving…</span>}
          {hasPayment && !isSaving && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Payment ✓
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onGenerate(attendee.clientId)}
          disabled={isGenerating || hasPayment}
          className="rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
        >
          {hasPayment
            ? "Paid"
            : isGenerating
              ? "Generating…"
              : "Generate payment"}
        </button>
        <button
          type="button"
          onClick={() => onRemove(attendee.clientId)}
          aria-label={`Remove attendee ${name}`}
          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          Remove
        </button>
      </div>
    </li>
  )
}
