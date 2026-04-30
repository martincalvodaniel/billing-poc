"use client"

import { useMemo, useState } from "react"
import { useAbsenceSummary } from "../../../lib/hooks/useAbsenceSummary"
import { useAbsences } from "../../../lib/hooks/useAbsences"
import PageLayout from "../../components/PageLayout"
import MonthPicker from "../../month/components/MonthPicker"
import AbsencesMonthCalendar from "./AbsencesMonthCalendar"
import AbsencesSummaryTable from "./AbsencesSummaryTable"
import AbsencesViewToggle, { type AbsencesView } from "./AbsencesViewToggle"
import AbsencesWeekCalendar from "./AbsencesWeekCalendar"
import DayDetailModal from "./DayDetailModal"
import StudentDetailModal from "./StudentDetailModal"

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })
}

export default function AbsencesPageContent() {
  const [view, setView] = useState<AbsencesView>("month")
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [dayModalDate, setDayModalDate] = useState<string | null>(null)
  const [studentModalName, setStudentModalName] = useState<string | null>(null)

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth() + 1

  const { absences } = useAbsences({ year, month })
  const { rows: summaryRows } = useAbsenceSummary()

  const currentMonthStart = useMemo(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  }, [])
  const isViewingCurrentMonth =
    selectedDate.getFullYear() === currentMonthStart.getFullYear() &&
    selectedDate.getMonth() === currentMonthStart.getMonth()

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setSelectedDate(new Date(newYear, newMonth, 1))
  }

  const handleGoToCurrentMonth = () => {
    if (isViewingCurrentMonth) return
    setSelectedDate(currentMonthStart)
  }

  const dayModalRecords = useMemo(() => {
    if (!dayModalDate) return []
    return absences.filter((record) => record.date === dayModalDate)
  }, [absences, dayModalDate])

  const studentModalRecords = useMemo(() => {
    if (!studentModalName) return []
    return absences.filter((record) => record.studentName === studentModalName)
  }, [absences, studentModalName])

  return (
    <PageLayout
      navigationSubtitle="Absences"
      headerContent={
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Absences
              </p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {formatMonthYear(selectedDate)}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AbsencesViewToggle value={view} onChange={setView} />
              <MonthPicker
                selectedDate={selectedDate}
                onMonthChange={handleMonthChange}
                showCalendar={showCalendar}
                onShowCalendarChange={setShowCalendar}
                isViewingCurrentMonth={isViewingCurrentMonth}
                onGoToCurrentMonth={handleGoToCurrentMonth}
              />
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        {view === "month" && (
          <AbsencesMonthCalendar
            records={absences}
            selectedDate={selectedDate}
            onDayClick={setDayModalDate}
          />
        )}
        {view === "week" && (
          <AbsencesWeekCalendar
            records={absences}
            selectedDate={selectedDate}
            onDayClick={setDayModalDate}
            onWeekChange={setSelectedDate}
          />
        )}
        {view === "summary" && (
          <AbsencesSummaryTable
            rows={summaryRows}
            onStudentClick={setStudentModalName}
          />
        )}
      </div>

      {dayModalDate && (
        <DayDetailModal
          date={dayModalDate}
          records={dayModalRecords}
          onClose={() => setDayModalDate(null)}
        />
      )}

      {studentModalName && (
        <StudentDetailModal
          studentName={studentModalName}
          records={studentModalRecords}
          onClose={() => setStudentModalName(null)}
        />
      )}
    </PageLayout>
  )
}
