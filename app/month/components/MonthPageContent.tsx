"use client"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import AddButton from "../../components/AddButton"
import ChartsToggle from "../../components/ChartsToggle"
import { Modal } from "../../components/Modal"
import PageLayout from "../../components/PageLayout"
import MonthlyPaymentsView from "./MonthlyPaymentsView"
import MonthPicker from "./MonthPicker"

const PaymentForm = dynamic(() => import("./PaymentForm"), { ssr: false })

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
  function handleIsSubmittingChange() {
    setIsSubmitting(true)
    formRef.current?.submit()
    // Reset after a brief delay to allow form submission to process
    setTimeout(() => {
      return setIsSubmitting(false)
    }, 100)
  }
  const searchParams = useSearchParams()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() =>
    parseSearchParamsDate(searchParams)
  )
  const [showCalendar, setShowCalendar] = useState(false)
  const [showCharts, setShowCharts] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<{
    setFormDate: (dateString: string) => void
    submit: () => void
  }>(null)
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
  const handlePaymentSaved = (date: string) => {
    formRef.current?.setFormDate(date)
    // Payments cache invalidation is handled by the mutation hooks themselves.
    setShowPaymentModal(false)
  }
  const handleAddPaymentClick = () => {
    setShowPaymentModal(true)
  }
  const handleCloseModal = useCallback(() => {
    setShowPaymentModal(false)
    setIsSubmitting(false)
  }, [])
  const handleCalendarMonthSelect = (year: number, month: number) => {
    const nextDate = new Date(year, month, 1)
    setSelectedDate(nextDate)
    formRef.current?.setFormDate(formatDateString(nextDate))
  }
  const handleGoToCurrentMonth = () => {
    if (isViewingCurrentMonth) return
    setSelectedDate(currentMonthStart)
    formRef.current?.setFormDate(formatDateString(currentMonthStart))
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

      {showPaymentModal ? (
        <Modal
          isOpen={showPaymentModal}
          onClose={handleCloseModal}
          title="New Payment"
          maxWidth="lg"
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIsSubmittingChange}
                disabled={isSubmitting}
                className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
              >
                {isSubmitting ? "Saving..." : "Save Payment"}
              </button>
            </div>
          }
        >
          <PaymentForm
            ref={formRef}
            onPaymentSaved={handlePaymentSaved}
            initialDate={initialDate}
          />
        </Modal>
      ) : null}
    </PageLayout>
  )
}
