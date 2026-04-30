import type {
  Absence,
  AbsenceType,
  PartOfDay,
} from "@/lib/domain/entities/absence"
import { PART_OF_DAY_LABEL } from "../absencesUi"
import RecordSection from "./RecordSection"

interface PartSectionProps {
  part: PartOfDay
  records: Absence[]
  editingId: string | undefined
  onEdit: (record: Absence) => void
  onDelete: (record: Absence) => void
  onAddNew: (type: AbsenceType) => void
}

export default function PartSection({
  part,
  records,
  editingId,
  onEdit,
  onDelete,
  onAddNew,
}: PartSectionProps) {
  const label = PART_OF_DAY_LABEL[part]
  const absences = records.filter((r) => r.type === "absence")
  const recoveries = records.filter((r) => r.type === "recovery")

  return (
    <section
      className="space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
      aria-labelledby={`day-part-${part}`}
    >
      <header className="flex items-center justify-between gap-2">
        <h3
          id={`day-part-${part}`}
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {label}
          <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            ({records.length})
          </span>
        </h3>
      </header>
      <RecordSection
        title="Absences"
        colorClass="bg-red-500"
        records={absences}
        editingId={editingId}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddNew={() => onAddNew("absence")}
        addAriaLabel={`Add absence in ${label}`}
      />
      <RecordSection
        title="Recoveries"
        colorClass="bg-green-500"
        records={recoveries}
        editingId={editingId}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddNew={() => onAddNew("recovery")}
        addAriaLabel={`Add recovery in ${label}`}
      />
    </section>
  )
}
