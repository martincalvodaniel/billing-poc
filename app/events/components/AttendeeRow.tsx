"use client"

import { useEffect, useRef, useState } from "react"
import type { EventAttendee } from "@/lib/domain/entities/event"

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

export default function AttendeeRow({
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
          {isSaving && (
            <span aria-live="polite" aria-atomic="true">
              Saving…
            </span>
          )}
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
