"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import ChartsToggle from "../../components/ChartsToggle"
import Modal from "../../components/Modal"
import PageLayout from "../../components/PageLayout"
import MonthlyPaymentsView from "./MonthlyPaymentsView"
import MonthSelector from "./MonthSelector"
import PaymentForm from "./PaymentForm"

export default function MonthPageContent() {
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [showCharts, setShowCharts] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<{
    setFormDate: (dateString: string) => void
    submit: () => void
  }>(null)
  const paymentsListRef = useRef<{
    refreshPayments: () => void
    navigateToMonth: (dateString: string) => void
    getFilteredPaymentsCount: () => number
  }>(null)

  // Initialize from URL parameters if provided
  useEffect(() => {
    const monthParam = searchParams.get("month")
    const yearParam = searchParams.get("year")

    if (monthParam && yearParam) {
      const month = parseInt(monthParam, 10)
      const year = parseInt(yearParam, 10)

      // Validate month is 1-12
      if (month >= 1 && month <= 12 && year > 0) {
        startTransition(() => {
          setSelectedDate(new Date(year, month - 1, 1))
        })
      }
    }
  }, [searchParams])

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

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  const handlePaymentSaved = (date: string) => {
    formRef.current?.setFormDate(date)
    paymentsListRef.current?.refreshPayments()
    paymentsListRef.current?.navigateToMonth(date)
    setShowPaymentModal(false)
  }

  const handleMonthChange = (dateString: string) => {
    formRef.current?.setFormDate(dateString)
  }

  const handleAddPaymentClick = () => {
    setShowPaymentModal(true)
  }

  const handleCloseModal = useCallback(() => {
    setShowPaymentModal(false)
    setIsSubmitting(false)
  }, [])

  const handleCalendarMonthSelect = (year: number, month: number) => {
    setSelectedDate(new Date(year, month, 1))
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
              <button
                type="button"
                onClick={() => handleAddPaymentClick()}
                aria-label="Add payment"
                className="inline-flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
              >
                <span aria-hidden="true">➕</span>
              </button>
              <ChartsToggle showCharts={showCharts} onToggle={setShowCharts} />
              <MonthSelector
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
          ref={paymentsListRef}
          onMonthChange={handleMonthChange}
          selectedDate={selectedDate}
          showCharts={showCharts}
        />
      </div>

      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={handleCloseModal}
          title="New Payment"
          maxWidth="lg"
          closeOnEscape={true}
          closeOnBackdropClick={true}
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
                onClick={() => {
                  setIsSubmitting(true)
                  formRef.current?.submit()
                  // Reset after a brief delay to allow form submission to process
                  setTimeout(() => setIsSubmitting(false), 100)
                }}
                disabled={isSubmitting}
                className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
              >
                {isSubmitting ? "Saving..." : "Save Payment"}
              </button>
            </div>
          }
        >
          <PaymentForm ref={formRef} onPaymentSaved={handlePaymentSaved} />
        </Modal>
      )}
    </PageLayout>
  )
}
