"use client"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import PageLayout from "@/components/shared/PageLayout"
import AddButton from "@/components/ui/AddButton"
import ChartsToggle from "@/components/ui/ChartsToggle"
import PaymentFormModal from "../PaymentFormModal"
import MonthlyPaymentsView from "./MonthlyPaymentsView"
import MonthPicker from "./MonthPicker"

function parseSearchParamsDate(
  searchParams: ReturnType<typeof useSearchParams>
): Date {
  const monthParam = searchParams.get("month")
  const yearParam = searchParams.get("year")
  if (monthParam && yearParam) {
    const month = parseInt(monthParam, 10)
    const year = parseInt(yearParam, 10)
    if (month >= 1 && month <= 12 && year > 0) {
      return new Date(year, month - 1, 1)
    }
  }
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), 1)
}
function formatDateString(date: Date): string {
  const yearStr = date.getFullYear()
  const monthStr = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${yearStr}-${monthStr}-${day}`
}
export default function MonthPageContent() {
  const searchParams = useSearchParams()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() =>
    parseSearchParamsDate(searchParams)
  )
  const [showCalendar, setShowCalendar] = useState(false)
  const [showCharts, setShowCharts] = useState(true)
  // On mobile, hide charts by default after mount
  useEffect(() => {
    if (!window.matchMedia("(min-width: 640px)").matches) {
      setShowCharts(false)
    }
  }, [])
  const currentMonthDate = new Date()
  const currentMonthStart = new Date(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth(),
    1
  )
  const isViewingCurrentMonth =
    selectedDate.getFullYear() === currentMonthStart.getFullYear() &&
    selectedDate.getMonth() === currentMonthStart.getMonth()
  const initialDate = isViewingCurrentMonth
    ? formatDateString(currentMonthDate)
    : formatDateString(selectedDate)
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }
  const handleAddPaymentClick = () => {
    setShowPaymentModal(true)
  }
  const handleCloseModal = () => {
    setShowPaymentModal(false)
  }
  const handleCalendarMonthSelect = (year: number, month: number) => {
    const nextDate = new Date(year, month, 1)
    setSelectedDate(nextDate)
  }
  const handleGoToCurrentMonth = () => {
    if (isViewingCurrentMonth) return
    setSelectedDate(currentMonthStart)
  }
  return (
    <PageLayout
      navigationSubtitle="Monthly Overview"
      headerContent={
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Monthly Filter
              </p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Overview for {formatMonthYear(selectedDate)}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AddButton
                ariaLabel="Add payment"
                onClick={handleAddPaymentClick}
              />
              <ChartsToggle showCharts={showCharts} onToggle={setShowCharts} />
              <MonthPicker
                selectedDate={selectedDate}
                onMonthChange={handleCalendarMonthSelect}
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
        <MonthlyPaymentsView
          selectedDate={selectedDate}
          showCharts={showCharts}
        />
      </div>

      <PaymentFormModal
        isOpen={showPaymentModal}
        onClose={handleCloseModal}
        title="New Payment"
        initialDate={initialDate}
      />
    </PageLayout>
  )
}
