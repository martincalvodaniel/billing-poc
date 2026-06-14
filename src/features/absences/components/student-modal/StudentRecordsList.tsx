"use client"

import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { Absence } from "@/lib/domain/entities/absence"
import { formatDate } from "@/lib/utils/formatters"
import { PART_OF_DAY_LABEL, TYPE_DOT_CLASS, TYPE_LABEL } from "../absencesUi"
import RecordRowActions from "../RecordRowActions"
import { type GroupedRecords, groupStudentRecords } from "./groupStudentRecords"

interface StudentRecordsListProps {
  /** Pre-computed grouping. If omitted, `records` is grouped internally. */
  groups?: GroupedRecords
  records?: Absence[]
  /** ID of the record currently being edited (for highlight). */
  editingId?: string
  onEdit: (record: Absence) => void
  onDelete: (record: Absence) => void
}

/**
 * Renders the date → partOfDay → type nested record list inside
 * `StudentDetailModal`. Owns no state — all interactions delegate to
 * the parent. Markup preserves iter11 structure verbatim.
 */
export default function StudentRecordsList({
  groups,
  records,
  editingId,
  onEdit,
  onDelete,
}: StudentRecordsListProps) {
  const resolved: GroupedRecords =
    groups ?? (records ? groupStudentRecords(records) : [])

  if (resolved.length === 0) {
    return <EmptyState>No records yet.</EmptyState>
  }

  return (
    <div className="space-y-4">
      {resolved.map((dateGroup) => {
        return (
          <div key={dateGroup.date} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              {formatDate(dateGroup.date)}
            </h4>
            <div className="space-y-3 pl-2">
              {dateGroup.parts.map((partGroup) => {
                return (
                  <div
                    key={`${dateGroup.date}-${partGroup.partOfDay}`}
                    className="space-y-2"
                  >
                    <h5 className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {PART_OF_DAY_LABEL[partGroup.partOfDay]}
                    </h5>
                    {partGroup.types.map((typeGroup) => {
                      return (
                        <div
                          key={`${dateGroup.date}-${partGroup.partOfDay}-${typeGroup.type}`}
                          className="space-y-1"
                        >
                          <h6 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                            {TYPE_LABEL[typeGroup.type]}
                          </h6>
                          <ul className="space-y-2">
                            {typeGroup.items.map((record) => (
                              <StudentRecordItem
                                key={
                                  record._id ??
                                  `${record.date}-${record.partOfDay}-${record.type}`
                                }
                                record={record}
                                isEditing={editingId === record._id}
                                onEdit={onEdit}
                                onDelete={onDelete}
                              />
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StudentRecordItem({
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">
            <span
              aria-hidden="true"
              className={`mr-1.5 inline-block h-2 w-2 rounded-full ${TYPE_DOT_CLASS[record.type]}`}
            />
            {TYPE_LABEL[record.type]}
          </Badge>
        </div>
      </div>
      <RecordRowActions
        onEdit={handleEdit}
        onDelete={handleDelete}
        editLabel={`Edit ${record.type} on ${formatDate(record.date)}`}
        deleteLabel={`Delete ${record.type} on ${formatDate(record.date)}`}
      />
    </li>
  )
}
