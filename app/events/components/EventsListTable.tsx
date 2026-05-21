"use client"

import { useMemo } from "react"
import type { Event } from "@/lib/domain/entities/event"
import { formatCurrency } from "@/lib/formatters"
import {
  compareEventsChronologicalAsc,
  formatDuration,
  formatEventDateTime,
  totalSeats,
} from "./eventsUi"

interface EventsListTableProps {
  events: Event[]
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
  onOpenDetail: (event: Event) => void
  onGenerateAllPayments: (event: Event) => void
  pendingGenerateAllId?: string | null
}

export default function EventsListTable({
  events,
  onEdit,
  onDelete,
  onOpenDetail,
  onGenerateAllPayments,
  pendingGenerateAllId,
}: EventsListTableProps) {
  const sorted = useMemo(
    () => events.slice().sort(compareEventsChronologicalAsc),
    [events]
  )

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        No events yet. Click <span className="font-medium">New event</span> to
        create one.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <Th>Title</Th>
            <Th>Date / Time</Th>
            <Th>Duration</Th>
            <Th>Attendees</Th>
            <Th>Max</Th>
            <Th>Price / seat (gross)</Th>
            <Th>VAT rate</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {sorted.map((event) => {
            const seats = totalSeats(event.attendees)
            const eventId = event._id ?? event.title
            const generatingAll = pendingGenerateAllId === event._id
            return (
              <tr
                key={eventId}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              >
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(event)}
                    className="text-left font-medium text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-300"
                  >
                    {event.title}
                  </button>
                  {event.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {event.description}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatEventDateTime(event)}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatDuration(event.durationMinutes)}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {event.attendees.length} client
                  {event.attendees.length === 1 ? "" : "s"} / {seats} seat
                  {seats === 1 ? "" : "s"}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {event.maxAttendees ?? "—"}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatCurrency(event.pricePerSeat)}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {event.vatRate}%
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(event)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onGenerateAllPayments(event)}
                      disabled={generatingAll || event.attendees.length === 0}
                      className="rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                    >
                      {generatingAll ? "Generating…" : "Generate payments"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(event)}
                      aria-label={`Delete event ${event.title}`}
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode
  align?: "left" | "right"
}) {
  return (
    <th
      scope="col"
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  )
}
