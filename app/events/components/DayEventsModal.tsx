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
  onOpenDetail: (event: Event) => void
  onAddEventForDay: (day: number) => void
  onGenerateAllPayments: (event: Event) => void
  pendingGenerateAllId?: string | null
}

export default function DayEventsModal({
  dateKey,
  events,
  onClose,
  onEdit,
  onDelete,
  onOpenDetail,
  onAddEventForDay,
  onGenerateAllPayments,
  pendingGenerateAllId,
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
      <EventsListTable
        events={events}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenDetail={onOpenDetail}
        onGenerateAllPayments={onGenerateAllPayments}
        pendingGenerateAllId={pendingGenerateAllId ?? null}
      />
    </Modal>
  )
}
