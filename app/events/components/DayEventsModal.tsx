"use client"

import AddButton from "@/app/components/AddButton"
import Modal from "@/app/components/Modal"
import type { Event } from "@/lib/domain/entities/event"
import { formatCurrency, formatDate } from "@/lib/formatters"
import { formatDuration, formatEventDateTime, totalSeats } from "./eventsUi"

interface DayEventsModalProps {
  dateKey: string
  events: Event[]
  onClose: () => void
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
  onOpenDetail: (event: Event) => void
  onAddEventForDay: (day: number) => void
}

export default function DayEventsModal({
  dateKey,
  events,
  onClose,
  onEdit,
  onDelete,
  onOpenDetail,
  onAddEventForDay,
}: DayEventsModalProps) {
  const dateLabel = formatDate(dateKey)
  const handleAdd = () => {
    onAddEventForDay(Number(dateKey.slice(8, 10)))
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={dateLabel}
      maxWidth="lg"
      closeOnEscape
      closeOnBackdropClick
    >
      <div className="-mt-2 mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {dateLabel}
        </h3>
        <AddButton
          ariaLabel={`Add event on ${dateLabel}`}
          onClick={handleAdd}
        />
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No events on this day.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {events.map((event) => {
            const seats = totalSeats(event.attendees)
            return (
              <li
                key={event._id ?? event.title}
                className="flex flex-wrap items-start justify-between gap-2 py-3"
              >
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(event)}
                    className="text-left text-sm font-semibold text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-300"
                  >
                    {event.title}
                  </button>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatEventDateTime(event)} ·{" "}
                    {formatDuration(event.durationMinutes)} ·{" "}
                    {event.attendees.length} clients / {seats} seats ·{" "}
                    {formatCurrency(event.pricePerSeat)} / seat (VAT{" "}
                    {event.vatRate}%)
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(event)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(event)}
                    aria-label={`Delete event ${event.title}`}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
