"use client"
import { ConfirmDialog } from "@/app/components/ConfirmDialog"
import type { Event } from "@/lib/domain/entities/event"
import { formatEventDateTime } from "./eventsUi"

interface EventDeleteDialogProps {
  event: Event | null
  isPending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}
export default function EventDeleteDialog({
  event,
  isPending,
  error,
  onCancel,
  onConfirm,
}: EventDeleteDialogProps) {
  return (
    <ConfirmDialog
      isOpen={!!event}
      title="Delete event"
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      variant="danger"
      isPending={isPending}
      error={error}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Delete event{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {event?.title ?? ""}
        </span>
        ? This cannot be undone.
      </p>
      {event ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Date & Time: {formatEventDateTime(event)}
        </p>
      ) : null}
    </ConfirmDialog>
  )
}
