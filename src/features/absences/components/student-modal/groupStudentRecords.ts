import type {
  Absence,
  AbsenceType,
  PartOfDay,
} from "@/lib/domain/entities/absence"

const PART_OF_DAY_ORDER: PartOfDay[] = ["morning", "evening"]
const TYPE_ORDER: AbsenceType[] = ["absence", "recovery"]

interface GroupedTypeBucket {
  type: AbsenceType
  items: Absence[]
}

interface GroupedPartBucket {
  partOfDay: PartOfDay
  types: GroupedTypeBucket[]
}

interface GroupedDateBucket {
  date: string
  parts: GroupedPartBucket[]
}

export type GroupedRecords = GroupedDateBucket[]

/**
 * Group absence records by date (desc) → partOfDay (morning, evening)
 * → type (absence, recovery). Empty groups are pruned.
 *
 * Pure helper extracted from `StudentDetailModal.tsx` (iter11) — semantics
 * preserved verbatim so existing UI behavior is unchanged.
 */
export function groupStudentRecords(records: Absence[]): GroupedRecords {
  const byDate = new Map<string, Absence[]>()
  for (const r of records) {
    const list = byDate.get(r.date)
    if (list) list.push(r)
    else byDate.set(r.date, [r])
  }
  const dates = Array.from(byDate.keys()).sort((a, b) =>
    a < b ? 1 : a > b ? -1 : 0
  )
  return dates.map((date) => {
    const dayRecords = byDate.get(date) ?? []
    const parts = PART_OF_DAY_ORDER.map((part) => {
      const partRecords = dayRecords.filter((r) => r.partOfDay === part)
      const types = TYPE_ORDER.map((t) => ({
        type: t,
        items: partRecords.filter((r) => r.type === t),
      })).filter((g) => g.items.length > 0)
      return { partOfDay: part, types }
    }).filter((p) => p.types.length > 0)
    return { date, parts }
  })
}
