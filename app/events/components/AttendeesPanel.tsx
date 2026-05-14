"use client"

import { useId, useState } from "react"
import ClientSelector from "@/app/components/ClientSelector"
import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import {
  useAddEventAttendee,
  useGenerateEventPayment,
  useGenerateEventPayments,
  useRemoveEventAttendee,
  useUpdateEventAttendee,
} from "@/lib/hooks/useEventMutations"
import { FetchError } from "@/lib/swr-fetcher"
import { totalSeats } from "./eventsUi"

interface AttendeesPanelProps {
  event: Event
  onActionSuccess: (message: string) => void
  onActionError: (message: string) => void
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
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingSeats, setEditingSeats] = useState<string>("1")
  const [pendingPayment, setPendingPayment] = useState<string | null>(null)
  const [pendingBulk, setPendingBulk] = useState(false)

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

  const handleStartEdit = (attendee: EventAttendee) => {
    setEditingClientId(attendee.clientId)
    setEditingSeats(String(attendee.seats))
  }

  const handleCancelEdit = () => {
    setEditingClientId(null)
  }

  const handleSaveEdit = async (clientId: string) => {
    if (!eventId) return
    const seatsNum = Number(editingSeats)
    if (!Number.isFinite(seatsNum) || seatsNum < 1) {
      onActionError("Seats must be at least 1")
      return
    }
    try {
      await updateMutation.trigger({ eventId, clientId, seats: seatsNum })
      setEditingClientId(null)
      onActionSuccess("Attendee updated")
    } catch (error) {
      onActionError(extractErrorMessage(error, "Failed to update attendee"))
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Attendees
          <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            ({event.attendees.length} clients / {seats} seats
            {event.maxAttendees !== undefined && ` / max ${event.maxAttendees}`}
            )
          </span>
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
            const isEditing = editingClientId === attendee.clientId
            const isGenerating = pendingPayment === attendee.clientId
            const hasPayment = Boolean(attendee.paymentId)
            return (
              <li
                key={attendee.clientId}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate font-medium text-zinc-900 dark:text-zinc-100"
                    title={attendee.clientId}
                  >
                    {attendee.clientId}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isEditing ? (
                      <>
                        <label
                          htmlFor={`${id}-seats-${attendee.clientId}`}
                          className="mr-1"
                        >
                          Seats:
                        </label>
                        <input
                          id={`${id}-seats-${attendee.clientId}`}
                          type="number"
                          min={1}
                          value={editingSeats}
                          onChange={(e) => setEditingSeats(e.target.value)}
                          className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </>
                    ) : (
                      <>
                        {attendee.seats} seat{attendee.seats === 1 ? "" : "s"}
                        {hasPayment && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Payment ✓
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(attendee.clientId)}
                        disabled={updateMutation.isMutating}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-md px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(attendee)}
                        className="rounded-md px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateOne(attendee.clientId)}
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
                        onClick={() => handleRemove(attendee.clientId)}
                        aria-label={`Remove attendee ${attendee.clientId}`}
                        className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </li>
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
              id={`${id}-add-seats`}
              type="number"
              min={1}
              value={addSeats}
              onChange={(e) => setAddSeats(e.target.value)}
              className="w-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
    </section>
  )
}
