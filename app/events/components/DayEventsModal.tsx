"use client"

import AddButton from "@/app/components/AddButton"
import { Modal } from "@/app/components/Modal"
import type { Event } from "@/lib/domain/entities/event"
import { formatDate } from "@/lib/formatters"
import EventsListTable from "./EventsListTable"

interface DayEventsModalProps {
  dateKey: string
  events: Event[]
  onClose: () => void
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
  onSkipOccurrence?: (event: Event, dateKey: string) => void
  onAddEventForDay: (day: number) => void
}

export default function DayEventsModal({
  dateKey,
  events,
  onClose,
  onEdit,
  onDelete,
  onSkipOccurrence,
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
      maxWidth="xl"
      headerActions={
        <AddButton
          ariaLabel={`Add event on ${dateLabel}`}
          onClick={handleAdd}
        />
      }
    >
      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
        For recurring events, use{" "}
        <span className="font-medium">Exclude date</span> to skip this
        occurrence (for example, holidays).
      </p>
      <EventsListTable
        events={events}
        onEdit={onEdit}
        onDelete={onDelete}
        onSkipOccurrence={onSkipOccurrence}
        dateKey={dateKey}
      />
    </Modal>
  )
}
