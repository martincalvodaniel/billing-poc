import { TrashIcon } from "@/app/components/icons/TrashIcon"
import { PencilIcon } from "./icons"

interface RecordRowActionsProps {
  onEdit: () => void
  onDelete: () => void
  editLabel: string
  deleteLabel: string
  disabled?: boolean
}

export default function RecordRowActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  disabled,
}: RecordRowActionsProps) {
  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        aria-label={editLabel}
        className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
      >
        <PencilIcon />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label={deleteLabel}
        className="rounded-md p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
      >
        <TrashIcon />
      </button>
    </div>
  )
}
