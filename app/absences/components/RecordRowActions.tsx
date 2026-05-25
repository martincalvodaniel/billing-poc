import { IconButton } from "@/app/components/IconButton"
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
      <IconButton
        variant="neutral"
        onClick={onEdit}
        disabled={disabled}
        ariaLabel={editLabel}
      >
        <PencilIcon />
      </IconButton>
      <IconButton
        variant="danger"
        onClick={onDelete}
        disabled={disabled}
        ariaLabel={deleteLabel}
      >
        <TrashIcon />
      </IconButton>
    </div>
  )
}
