"use client"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import PageLayout from "@/components/shared/PageLayout"
import SuggestionInput from "@/components/shared/SuggestionInput"
import AddButton from "@/components/ui/AddButton"
import ChartsToggle from "@/components/ui/ChartsToggle"
import ClearButton from "@/components/ui/ClearButton"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import PaymentTemplateFormModal from "@/features/payment-templates/components/PaymentTemplateFormModal"
import { useDeletePaymentTemplate } from "@/features/payment-templates/hooks/usePaymentTemplateMutations"
import { usePaymentTemplates } from "@/features/payment-templates/hooks/usePaymentTemplates"
import { buildPaymentTemplateFormData } from "@/features/payment-templates/utils"
import type { PaymentTemplate } from "@/lib/domain/entities/payment-template"
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

function extractPaymentTemplateMutationError(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message
  }
  if (typeof error === "string" && error.trim() !== "") {
    return error
  }
  return fallback
}

export default function MonthPageContent() {
  const searchParams = useSearchParams()
  const { paymentTemplates } = usePaymentTemplates()
  const {
    trigger: deletePaymentTemplate,
    isMutating: isDeleting,
    error: deletePaymentTemplateError,
    reset: resetDeletePaymentTemplate,
  } = useDeletePaymentTemplate()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentTemplateModal, setShowPaymentTemplateModal] =
    useState(false)
  const [paymentTemplateQuery, setPaymentTemplateQuery] = useState("")
  const [selectedPaymentTemplateName, setSelectedPaymentTemplateName] =
    useState<string | undefined>()
  const [editingPaymentTemplate, setEditingPaymentTemplate] =
    useState<PaymentTemplate | null>(null)
  const [paymentTemplateToDelete, setPaymentTemplateToDelete] =
    useState<PaymentTemplate | null>(null)
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
  const selectedPaymentTemplate = useMemo(
    () =>
      paymentTemplates.find(
        (paymentTemplate) =>
          paymentTemplate.name === selectedPaymentTemplateName
      ),
    [paymentTemplates, selectedPaymentTemplateName]
  )
  const initialPaymentData = useMemo(() => {
    if (!selectedPaymentTemplate) return undefined
    return buildPaymentTemplateFormData(selectedPaymentTemplate, initialDate)
  }, [initialDate, selectedPaymentTemplate])
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }
  const handleAddPaymentClick = () => {
    setShowPaymentModal(true)
  }

  const clearSelectedPaymentTemplate = useCallback(() => {
    setPaymentTemplateQuery("")
    setSelectedPaymentTemplateName(undefined)
  }, [])

  const handlePaymentTemplateQueryChange = useCallback(
    (value: string) => {
      setPaymentTemplateQuery(value)
      if (
        selectedPaymentTemplateName &&
        value !== selectedPaymentTemplateName
      ) {
        setSelectedPaymentTemplateName(undefined)
      }
    },
    [selectedPaymentTemplateName]
  )

  const handlePaymentTemplateSelect = useCallback((value: string) => {
    setPaymentTemplateQuery(value)
    setSelectedPaymentTemplateName(value)
  }, [])

  const handleClearPaymentTemplate = useCallback(() => {
    clearSelectedPaymentTemplate()
  }, [clearSelectedPaymentTemplate])

  const handleCreatePaymentTemplate = useCallback((value: string) => {
    setPaymentTemplateQuery(value)
    setSelectedPaymentTemplateName(undefined)
    setEditingPaymentTemplate(null)
    setShowPaymentTemplateModal(true)
  }, [])

  const handlePaymentTemplateSaved = useCallback((name: string) => {
    setPaymentTemplateQuery(name)
    setSelectedPaymentTemplateName(name)
    setEditingPaymentTemplate(null)
  }, [])

  const handleOpenPaymentTemplateEditor = useCallback(
    (templateName: string) => {
      const template = paymentTemplates.find(
        (paymentTemplate) => paymentTemplate.name === templateName
      )
      if (!template) return
      setEditingPaymentTemplate(template)
      setPaymentTemplateQuery(template.name)
      setSelectedPaymentTemplateName(template.name)
      setShowPaymentTemplateModal(true)
    },
    [paymentTemplates]
  )

  const handleDeletePaymentTemplate = useCallback(
    (templateName: string) => {
      const template = paymentTemplates.find(
        (paymentTemplate) => paymentTemplate.name === templateName
      )
      if (!template) return
      setPaymentTemplateToDelete(template)
    },
    [paymentTemplates]
  )

  const handleClosePaymentTemplateModal = useCallback(() => {
    setShowPaymentTemplateModal(false)
    setEditingPaymentTemplate(null)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    setPaymentTemplateToDelete(null)
    resetDeletePaymentTemplate()
  }, [resetDeletePaymentTemplate])

  const handleConfirmDeletePaymentTemplate = useCallback(async () => {
    if (!paymentTemplateToDelete?._id) return
    try {
      await deletePaymentTemplate({ id: paymentTemplateToDelete._id })
      if (selectedPaymentTemplateName === paymentTemplateToDelete.name) {
        clearSelectedPaymentTemplate()
      }
      if (paymentTemplateQuery === paymentTemplateToDelete.name) {
        setPaymentTemplateQuery("")
      }
      setPaymentTemplateToDelete(null)
    } catch (error) {
      console.error(`Error deleting payment template from UI: ${error}`)
    }
  }, [
    clearSelectedPaymentTemplate,
    deletePaymentTemplate,
    paymentTemplateQuery,
    paymentTemplateToDelete,
    selectedPaymentTemplateName,
  ])

  const handleConfirmDeleteDialogConfirm = useCallback(() => {
    void handleConfirmDeletePaymentTemplate()
  }, [handleConfirmDeletePaymentTemplate])

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
          <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Monthly Filter
              </p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Overview for {formatMonthYear(selectedDate)}
              </h3>
            </div>
            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:flex-wrap lg:items-end lg:justify-end">
              <div className="flex min-w-0 flex-nowrap items-end gap-2 lg:min-w-[20rem] lg:flex-1">
                <AddButton
                  ariaLabel="Add payment"
                  onClick={handleAddPaymentClick}
                />
                <div className="relative min-w-0 flex-1">
                  <SuggestionInput
                    ariaLabel="Payment template"
                    value={paymentTemplateQuery}
                    options={paymentTemplates.map(
                      (paymentTemplate) => paymentTemplate.name
                    )}
                    selectedOption={selectedPaymentTemplateName}
                    onChange={handlePaymentTemplateQueryChange}
                    onSelect={handlePaymentTemplateSelect}
                    onCreateNew={handleCreatePaymentTemplate}
                    onEditOption={handleOpenPaymentTemplateEditor}
                    onDeleteOption={handleDeletePaymentTemplate}
                    placeholder="Choose or type a template..."
                    createNewLabel="No payment template found"
                    createNewHint="Press Enter or click here to create a new template."
                  />
                  {paymentTemplateQuery ? (
                    <ClearButton
                      onClick={handleClearPaymentTemplate}
                      ariaLabel="Clear payment template"
                      className="top-1 right-1"
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <ChartsToggle
                  showCharts={showCharts}
                  onToggle={setShowCharts}
                />
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
        initialData={initialPaymentData}
      />

      <PaymentTemplateFormModal
        isOpen={showPaymentTemplateModal}
        initialName={editingPaymentTemplate?.name ?? paymentTemplateQuery}
        template={editingPaymentTemplate}
        onClose={handleClosePaymentTemplateModal}
        onSaved={handlePaymentTemplateSaved}
      />

      <ConfirmDialog
        isOpen={paymentTemplateToDelete !== null}
        title="Delete Payment Template"
        confirmLabel="Delete Template"
        pendingLabel="Deleting..."
        isPending={isDeleting}
        error={
          deletePaymentTemplateError
            ? extractPaymentTemplateMutationError(
                deletePaymentTemplateError,
                "Failed to delete payment template"
              )
            : null
        }
        onCancel={handleCloseDeleteDialog}
        onConfirm={handleConfirmDeleteDialogConfirm}
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {paymentTemplateToDelete ? (
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {paymentTemplateToDelete.name}
              </span>
              ? This action cannot be undone.
            </>
          ) : null}
        </p>
      </ConfirmDialog>
    </PageLayout>
  )
}
