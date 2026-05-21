"use client"

import Modal from "@/app/components/Modal"
import type { Event } from "@/lib/domain/entities/event"
import { formatCurrency } from "@/lib/formatters"
import AttendeesPanel from "./AttendeesPanel"
import { formatDuration, formatEventDateTime } from "./eventsUi"

interface EventDetailModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onEdit: (event: Event) => void
  onActionSuccess: (message: string) => void
  onActionError: (message: string) => void
}

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onActionSuccess,
  onActionError,
}: EventDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      maxWidth="lg"
      closeOnEscape
      closeOnBackdropClick
    >
      <div className="space-y-4">
        <AttendeesPanel
          event={event}
          onActionSuccess={onActionSuccess}
          onActionError={onActionError}
        />

        {event.description && (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {event.description}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <SummaryItem label="Date / Time" value={formatEventDateTime(event)} />
          <SummaryItem
            label="Duration"
            value={formatDuration(event.durationMinutes)}
          />
          <SummaryItem
            label="Price / seat (gross)"
            value={formatCurrency(event.pricePerSeat)}
          />
          <SummaryItem label="VAT rate" value={`${event.vatRate}%`} />
        </dl>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onEdit(event)}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Edit event
          </button>
        </div>
      </div>
    </Modal>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </dd>
    </div>
  )
}
