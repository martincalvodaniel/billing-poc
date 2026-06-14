"use client"
import { useMemo } from "react"
import { EmptyState } from "@/components/ui/EmptyState"
import { IconButton } from "@/components/ui/IconButton"
import { DuplicateIcon } from "@/components/ui/icons/DuplicateIcon"
import { TrashIcon } from "@/components/ui/icons/TrashIcon"
import { XIcon } from "@/components/ui/icons/XIcon"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { Event } from "@/lib/domain/entities/event"
import { activeMonthlyOccurrencesCount } from "@/lib/domain/services/event-pricing"
import { formatCurrency } from "@/lib/utils/formatters"
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
  const sorted = useMemo(() => {
    return events.slice().sort(compareEventsChronologicalAsc)
  }, [events])
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
          {sorted.map((event) => (
            <EventTableRow
              key={event._id ?? event.title}
              event={event}
              dateKey={dateKey}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={onCopy}
              onSkipOccurrence={onSkipOccurrence}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventTableRow({
  event,
  dateKey,
  onEdit,
  onDelete,
  onCopy,
  onSkipOccurrence,
}: {
  event: Event
  dateKey?: string
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
  onCopy?: (event: Event) => void
  onSkipOccurrence?: (event: Event, dateKey: string) => void
}) {
  const handleEdit = useStableCallback(() => onEdit(event))
  const handleDelete = useStableCallback(() => onDelete(event))
  const handleCopy = useStableCallback(() => onCopy?.(event))
  const handleSkipOccurrence = useStableCallback(() => {
    if (dateKey) onSkipOccurrence?.(event, dateKey)
  })
  const handleMouseDown = useStableCallback(
    (mouseEvent: React.MouseEvent<HTMLButtonElement>) =>
      mouseEvent.stopPropagation()
  )
  const handleRowKeyDown = useStableCallback(
    (keyboardEvent: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (keyboardEvent.target !== keyboardEvent.currentTarget) return
      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault()
        handleEdit()
      }
    }
  )
  const seats = totalSeats(event.attendees)
  const monthlyPrice = event.pricePerSeat * activeMonthlyOccurrencesCount(event)

  return (
    // biome-ignore lint/a11y/useSemanticElements: a <tr> cannot be a <button>; role="button" is the accessible pattern for clickable rows
    <tr
      onClick={handleEdit}
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
          {onCopy ? (
            <IconButton
              stopPropagation
              onClick={handleCopy}
              ariaLabel={`Copy event ${event.title}`}
            >
              <DuplicateIcon />
            </IconButton>
          ) : null}
          {onSkipOccurrence &&
          dateKey &&
          event.dayOfWeek !== undefined &&
          event.date !== dateKey ? (
            <button
              type="button"
              onClick={handleSkipOccurrence}
              onMouseDown={handleMouseDown}
              aria-label={`Exclude ${event.title} occurrence on ${dateKey}`}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <XIcon />
              Exclude date
            </button>
          ) : null}
          <IconButton
            variant="danger"
            stopPropagation
            onClick={handleDelete}
            ariaLabel={`Delete event ${event.title}`}
          >
            <TrashIcon />
          </IconButton>
        </div>
      </td>
    </tr>
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
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  )
}
