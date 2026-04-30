"use client"

import { useState } from "react"
import type { AbsenceSummaryRow } from "@/lib/domain/entities/absence"
import { formatDate } from "@/lib/formatters"

type SortKey =
  | "studentName"
  | "pending"
  | "totalAbsences"
  | "totalRecoveries"
  | "lastAbsenceDate"

type SortDir = "asc" | "desc"

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
  dir: SortDir
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
  const [sortKey, setSortKey] = useState<SortKey>("studentName")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [filter, setFilter] = useState("")

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const trimmedFilter = filter.trim().toLowerCase()
  const displayed = rows
    .filter((r) =>
      trimmedFilter === ""
        ? true
        : r.studentName.toLowerCase().includes(trimmedFilter)
    )
    .slice()
    .sort((a, b) => compareValues(a, b, sortKey, sortDir))

  const ariaSortFor = (key: SortKey): "ascending" | "descending" | "none" => {
    if (key !== sortKey) return "none"
    return sortDir === "asc" ? "ascending" : "descending"
  }

  const sortIndicator = (key: SortKey) => {
    if (key !== sortKey) return null
    return (
      <span aria-hidden="true" className="ml-1">
        {sortDir === "asc" ? "▲" : "▼"}
      </span>
    )
  }

  const handleRowKeyDown = (e: React.KeyboardEvent, studentName: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onStudentClick(studentName)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by student..."
          aria-label="Filter by student"
          className="w-full max-w-sm rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSortFor(col.key)}
                  className={`px-6 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className={`inline-flex items-center gap-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      col.align === "right" ? "justify-end" : "justify-start"
                    } hover:text-blue-600 dark:hover:text-blue-400`}
                  >
                    <span>{col.label}</span>
                    {sortIndicator(col.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr className="bg-white dark:bg-zinc-900">
                <td
                  colSpan={COLUMNS.length}
                  className="px-6 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {trimmedFilter === "" ? "No students yet" : "No matches"}
                </td>
              </tr>
            ) : (
              displayed.map((row, index) => (
                // biome-ignore lint/a11y/useSemanticElements: <tr> must remain a table row; role="button" provides clickable semantics
                <tr
                  key={row.studentName}
                  role="button"
                  tabIndex={0}
                  onClick={() => onStudentClick(row.studentName)}
                  onKeyDown={(e) => handleRowKeyDown(e, row.studentName)}
                  aria-label={`View details for ${row.studentName}`}
                  className={`border-b border-zinc-200 cursor-pointer transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:border-zinc-700 dark:hover:bg-blue-900/20 dark:focus:bg-blue-900/20 ${
                    index % 2 === 0
                      ? "bg-white dark:bg-zinc-900"
                      : "bg-zinc-50 dark:bg-zinc-800/50"
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
                    {row.lastAbsenceDate === null
                      ? "—"
                      : formatDate(row.lastAbsenceDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
