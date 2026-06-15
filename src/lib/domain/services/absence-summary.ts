import type { Absence, AbsenceSummaryRow } from "../entities/absence"

interface SummaryAccumulator {
  studentName: string
  totalAbsences: number
  totalRecoveries: number
  lastAbsenceDate: string | null
}

export function computeAbsenceSummary(records: Absence[]): AbsenceSummaryRow[] {
  const groups = new Map<string, SummaryAccumulator>()

  for (const record of records) {
    const trimmed = record.studentName.trim()
    if (trimmed === "") continue
    const key = trimmed.toLowerCase()
    let group = groups.get(key)
    if (!group) {
      group = {
        studentName: trimmed,
        totalAbsences: 0,
        totalRecoveries: 0,
        lastAbsenceDate: null,
      }
      groups.set(key, group)
    }
    if (record.type === "absence") {
      group.totalAbsences += 1
      if (
        group.lastAbsenceDate === null ||
        record.date > group.lastAbsenceDate
      ) {
        group.lastAbsenceDate = record.date
      }
    } else if (record.type === "recovery") {
      group.totalRecoveries += 1
    }
  }

  const rows: AbsenceSummaryRow[] = []
  for (const group of groups.values()) {
    rows.push({
      studentName: group.studentName,
      totalAbsences: group.totalAbsences,
      totalRecoveries: group.totalRecoveries,
      pending: group.totalAbsences - group.totalRecoveries,
      lastAbsenceDate: group.lastAbsenceDate,
    })
  }

  rows.sort((a, b) =>
    a.studentName.localeCompare(b.studentName, undefined, {
      sensitivity: "base",
    })
  )
  return rows
}

export function mergeStudentNames(
  absenceNames: string[],
  clientNames: string[]
): string[] {
  const seen = new Map<string, string>()
  for (const name of [...absenceNames, ...clientNames]) {
    const trimmed = name.trim()
    if (trimmed === "") continue
    const key = trimmed.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, trimmed)
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  )
}
