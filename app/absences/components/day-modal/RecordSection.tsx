import type { Absence } from "@/lib/domain/entities/absence"
import { PlusIcon } from "../icons"
import RecordRowActions from "../RecordRowActions"

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
        <button
          type="button"
          onClick={onAddNew}
          aria-label={addAriaLabel}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          <PlusIcon />
        </button>
      </div>
      {records.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">None.</p>
      ) : (
        <ul className="space-y-2">
          {records.map((record) => (
            <li
              key={record._id ?? `${record.studentName}-${record.date}`}
              className={`flex items-start gap-2 rounded-md border p-3 ${
                editingId && editingId === record._id
                  ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                  : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {record.studentName}
                </p>
                {record.comment && (
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 break-words">
                    {record.comment}
                  </p>
                )}
              </div>
              <RecordRowActions
                onEdit={() => onEdit(record)}
                onDelete={() => onDelete(record)}
                editLabel={`Edit ${record.type} for ${record.studentName}`}
                deleteLabel={`Delete ${record.type} for ${record.studentName}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
