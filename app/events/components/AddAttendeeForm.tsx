"use client"

import ClientSelector from "@/app/components/ClientSelector"

interface AddAttendeeFormProps {
  idPrefix: string
  addClientId: string | undefined
  addSeats: string
  remaining: number | undefined
  canAdd: boolean
  isMutating: boolean
  onClientChange: (clientId: string | undefined) => void
  onSeatsChange: (value: string) => void
  onAdd: () => void
}

export default function AddAttendeeForm({
  idPrefix,
  addClientId,
  addSeats,
  remaining,
  canAdd,
  isMutating,
  onClientChange,
  onSeatsChange,
  onAdd,
}: AddAttendeeFormProps) {
  return (
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
          onChange={onClientChange}
          label="Client"
          required
        />
        <div className="space-y-1">
          <label
            htmlFor={`${idPrefix}-add-seats`}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Seats
          </label>
          <input
            type="number"
            id={`${idPrefix}-add-seats`}
            value={addSeats}
            onChange={(event) => onSeatsChange(event.currentTarget.value)}
            min={1}
            step={1}
            aria-label="Seats to add"
            className="w-20 rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={onAdd}
            disabled={!canAdd}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMutating ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  )
}
