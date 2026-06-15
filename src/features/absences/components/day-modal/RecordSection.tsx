import { useStableCallback } from "@/hooks/useStableCallback"
import type { Absence } from "@/lib/domain/entities/absence"
import RecordRowActions from "../RecordRowActions"
import AddRecordButton from "../shared/AddRecordButton"

interface RecordSectionProps {
  title: string
  colorClass: string
  records: Absence[]
  editingId: string | undefined
  onEdit: (record: Absence) => void
  onDelete: (record: Absence) => void
  onAddNew: () => void
  addAriaLabel: string
}

export default function RecordSection({
  title,
  colorClass,
  records,
  editingId,
  onEdit,
  onDelete,
  onAddNew,
  addAriaLabel,
}: RecordSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <span
            aria-hidden="true"
            className={`inline-block h-2 w-2 rounded-full ${colorClass}`}
          />
          {title}
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            ({records.length})
          </span>
        </h4>
        <AddRecordButton
          onClick={onAddNew}
          ariaLabel={addAriaLabel}
          title={addAriaLabel}
        />
      </div>
      {records.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">None.</p>
      ) : (
        <ul className="space-y-2">
          {records.map((record) => (
            <RecordListItem
              key={record._id ?? `${record.studentName}-${record.date}`}
              record={record}
              isEditing={editingId === record._id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function RecordListItem({
  record,
  isEditing,
  onEdit,
  onDelete,
}: {
  record: Absence
  isEditing: boolean
  onEdit: (record: Absence) => void
  onDelete: (record: Absence) => void
}) {
  const handleEdit = useStableCallback(() => onEdit(record))
  const handleDelete = useStableCallback(() => onDelete(record))

  return (
    <li
      className={`flex items-start gap-2 rounded-md border p-3 ${
        isEditing
          ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {record.studentName}
        </p>
      </div>
      <RecordRowActions
        onEdit={handleEdit}
        onDelete={handleDelete}
        editLabel={`Edit ${record.type} for ${record.studentName}`}
        deleteLabel={`Delete ${record.type} for ${record.studentName}`}
      />
    </li>
  )
}
