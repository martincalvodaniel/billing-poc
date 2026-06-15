"use client"
import { useState } from "react"
import DebouncedSearchInput from "@/components/ui/DebouncedSearchInput"
import { EmptyState } from "@/components/ui/EmptyState"
import { SortableTableHeader } from "@/components/ui/SortableTableHeader"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { AbsenceSummaryRow } from "@/lib/domain/entities/absence"
import { formatDate } from "@/lib/utils/formatters"
import { nextSortState, type SortState } from "@/lib/utils/sort-state"

type SortKey =
  | "studentName"
  | "pending"
  | "totalAbsences"
  | "totalRecoveries"
  | "lastAbsenceDate"

interface AbsencesSummaryTableProps {
  rows: AbsenceSummaryRow[]
  onStudentClick: (studentName: string) => void
}

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "studentName", label: "Student", align: "left" },
  { key: "pending", label: "Pending", align: "right" },
  { key: "totalAbsences", label: "Total absences", align: "right" },
  { key: "totalRecoveries", label: "Total recoveries", align: "right" },
  { key: "lastAbsenceDate", label: "Last absence date", align: "left" },
]

function compareValues(
  a: AbsenceSummaryRow,
  b: AbsenceSummaryRow,
  key: SortKey,
  dir: SortState<SortKey>["sortDir"]
): number {
  // Nulls (only possible on lastAbsenceDate) always sort last regardless of dir.
  if (key === "lastAbsenceDate") {
    const av = a.lastAbsenceDate
    const bv = b.lastAbsenceDate
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1
    const cmp = av.localeCompare(bv)
    return dir === "asc" ? cmp : -cmp
  }

  if (key === "studentName") {
    const cmp = a.studentName.localeCompare(b.studentName, undefined, {
      sensitivity: "base",
    })
    return dir === "asc" ? cmp : -cmp
  }

  const av = a[key]
  const bv = b[key]
  const cmp = av - bv
  return dir === "asc" ? cmp : -cmp
}

function getPendingClass(pending: number): string {
  if (pending > 0) return "text-red-600 dark:text-red-400 font-semibold"
  if (pending < 0) return "text-green-600 dark:text-green-400 font-semibold"
  return "text-zinc-600 dark:text-zinc-400"
}

export default function AbsencesSummaryTable({
  rows,
  onStudentClick,
}: AbsencesSummaryTableProps) {
  const [sort, setSort] = useState<SortState<SortKey>>({
    sortBy: "studentName",
    sortDir: "asc",
  })
  const [filter, setFilter] = useState("")

  const handleSort = (key: SortKey) => {
    setSort((current) => nextSortState(current, key, "asc"))
  }

  const trimmedFilter = filter.trim().toLowerCase()
  const displayed = rows
    .filter((r) =>
      trimmedFilter === ""
        ? true
        : r.studentName.toLowerCase().includes(trimmedFilter)
    )
    .slice()
    .sort((a, b) => compareValues(a, b, sort.sortBy, sort.sortDir))

  const handleFilterChange = useStableCallback((query: string) =>
    setFilter(query)
  )
  return (
    <div className="space-y-4">
      <div>
        <DebouncedSearchInput
          onSearch={handleFilterChange}
          placeholder="Filter by student..."
          ariaLabel="Filter by student"
          clearAriaLabel="Clear student filter"
          debounceMs={0}
          containerClassName="relative max-w-sm"
          inputClassName="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              {COLUMNS.map((column) => (
                <SortableTableHeader
                  key={column.key}
                  label={column.label}
                  sortKey={column.key}
                  sort={sort}
                  onSortChange={handleSort}
                  align={column.align}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr className="bg-white dark:bg-zinc-900">
                <td colSpan={COLUMNS.length} className="px-6 py-8">
                  <EmptyState>
                    {trimmedFilter === "" ? "No students yet" : "No matches"}
                  </EmptyState>
                </td>
              </tr>
            ) : (
              displayed.map((row, index) => (
                <SummaryStudentRow
                  key={row.studentName}
                  row={row}
                  striped={index % 2 !== 0}
                  onStudentClick={onStudentClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SummaryStudentRow({
  row,
  striped,
  onStudentClick,
}: {
  row: AbsenceSummaryRow
  striped: boolean
  onStudentClick: (studentName: string) => void
}) {
  const openStudent = useStableCallback(() => onStudentClick(row.studentName))
  const handleKeyDown = useStableCallback(
    (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        openStudent()
      }
    }
  )
  return (
    // biome-ignore lint/a11y/useSemanticElements: <tr> must remain a table row; role="button" provides clickable semantics
    <tr
      role="button"
      tabIndex={0}
      onClick={openStudent}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${row.studentName}`}
      className={`border-b border-zinc-200 cursor-pointer transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:border-zinc-700 dark:hover:bg-blue-900/20 dark:focus:bg-blue-900/20 ${
        striped ? "bg-zinc-50 dark:bg-zinc-800/50" : "bg-white dark:bg-zinc-900"
      }`}
    >
      <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {row.studentName}
      </td>
      <td
        className={`px-6 py-4 text-right text-sm ${getPendingClass(row.pending)}`}
      >
        {row.pending}
      </td>
      <td className="px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
        {row.totalAbsences}
      </td>
      <td className="px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
        {row.totalRecoveries}
      </td>
      <td className="px-6 py-4 text-left text-sm text-zinc-600 dark:text-zinc-400">
        {row.lastAbsenceDate === null ? "—" : formatDate(row.lastAbsenceDate)}
      </td>
    </tr>
  )
}
