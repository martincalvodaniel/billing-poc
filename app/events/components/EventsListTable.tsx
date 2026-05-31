"use client"

import { useMemo } from "react"
import { EmptyState } from "@/app/components/EmptyState"
import { IconButton } from "@/app/components/IconButton"
import { DuplicateIcon } from "@/app/components/icons/DuplicateIcon"
import { TrashIcon } from "@/app/components/icons/TrashIcon"
import { XIcon } from "@/app/components/icons/XIcon"
import type { Event } from "@/lib/domain/entities/event"
import { activeMonthlyOccurrencesCount } from "@/lib/domain/services/event-pricing"
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
  onCopy?: (event: Event) => void
  /**
   * When provided alongside `dateKey`, recurring events whose canonical
   * `date` differs from `dateKey` (i.e. weekly expansions) get a "skip
   * occurrence" button. Clicking it adds `dateKey` to the event's
   * `excludedDates`.
   */
  onSkipOccurrence?: (event: Event, dateKey: string) => void
  dateKey?: string
}

export default function EventsListTable({
  events,
  onEdit,
  onDelete,
  onCopy,
  onSkipOccurrence,
  dateKey,
}: EventsListTableProps) {
  const sorted = useMemo(
    () => events.slice().sort(compareEventsChronologicalAsc),
    [events]
  )

  if (sorted.length === 0) {
    return (
      <EmptyState variant="card" className="bg-white dark:bg-zinc-900">
        No events yet. Click <span className="font-medium">New event</span> to
        create one.
      </EmptyState>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <Th>Title</Th>
            <Th>Date & Time</Th>
            <Th>Duration</Th>
            <Th>Occupancy</Th>
            <Th>Price</Th>
            <th />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {sorted.map((event) => {
            const seats = totalSeats(event.attendees)
            const monthlyOccurrences = activeMonthlyOccurrencesCount(event)
            const monthlyPrice = event.pricePerSeat * monthlyOccurrences
            const eventId = event._id ?? event.title
            const handleRowKeyDown = (
              e: React.KeyboardEvent<HTMLTableRowElement>
            ) => {
              if (e.target !== e.currentTarget) return
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onEdit(event)
              }
            }
            return (
              // biome-ignore lint/a11y/useSemanticElements: a <tr> cannot be a <button>; role="button" is the accessible pattern for clickable rows
              <tr
                key={eventId}
                onClick={() => onEdit(event)}
                onKeyDown={handleRowKeyDown}
                role="button"
                tabIndex={0}
                aria-label={`Edit event ${event.title}`}
                className="cursor-pointer hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:hover:bg-zinc-800/40"
              >
                <td className="px-3 py-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {event.title}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatEventDateTime(event)}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatDuration(event.durationMinutes)}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {seats} / {event.maxAttendees ?? "—"}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatCurrency(monthlyPrice)}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    {onCopy && (
                      <IconButton
                        stopPropagation
                        onClick={() => onCopy(event)}
                        ariaLabel={`Copy event ${event.title}`}
                      >
                        <DuplicateIcon />
                      </IconButton>
                    )}
                    {onSkipOccurrence &&
                      dateKey &&
                      event.dayOfWeek !== undefined &&
                      event.date !== dateKey && (
                        <button
                          type="button"
                          onClick={() => onSkipOccurrence(event, dateKey)}
                          onMouseDown={(e) => e.stopPropagation()}
                          aria-label={`Exclude ${event.title} occurrence on ${dateKey}`}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <XIcon />
                          Exclude date
                        </button>
                      )}
                    <IconButton
                      variant="danger"
                      stopPropagation
                      onClick={() => onDelete(event)}
                      ariaLabel={`Delete event ${event.title}`}
                    >
                      <TrashIcon />
                    </IconButton>
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
