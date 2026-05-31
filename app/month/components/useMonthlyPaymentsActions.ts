"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import type { Payment } from "@/lib/domain/entities/payment"
import { useDeletePayment } from "@/lib/hooks/usePaymentMutations"

const SUCCESS_TIMEOUT_MS = 4000

/**
 * Holds the CRUD-orchestration state for the monthly payments view: success
 * toast, delete confirmation, edit/duplicate modal selection, the
 * `?payment=<id>` deep-link effect, and Enter-to-confirm for delete.
 */
export function useMonthlyPaymentsActions({
  payments,
  isLoading,
  year,
  month,
}: {
  payments: Payment[]
  isLoading: boolean
  year: number
  month: number
}) {
  const { trigger: deletePayment, isMutating: isDeleting } = useDeletePayment()

  const [actionError, setActionError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [deleteConfirmPaymentId, setDeleteConfirmPaymentId] = useState<
    string | null
  >(null)
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null)
  const [duplicateSeed, setDuplicateSeed] = useState<Payment | null>(null)

  const flashSuccess = useCallback((message: string) => {
    setSuccessMessage(message)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), SUCCESS_TIMEOUT_MS)
  }, [])

  // Auto-open the payment-detail modal when arriving with ?payment=<id>.
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const consumedPaymentRef = useRef<string | null>(null)
  useEffect(() => {
    const target = searchParams.get("payment")
    if (!target) return
    if (consumedPaymentRef.current === target) return
    if (isLoading) return
    if (payments.some((p) => p._id === target)) {
      setEditPaymentId(target)
    }
    consumedPaymentRef.current = target
    router.replace(`${pathname}?year=${year}&month=${month}`, {
      scroll: false,
    })
  }, [payments, isLoading, searchParams, year, month, pathname, router])

  const handleRowClick = (paymentId: string) => {
    setEditPaymentId(paymentId)
  }

  const handleDeleteClick = (e: React.MouseEvent, paymentId: string) => {
    e.stopPropagation() // Prevent row click
    setDeleteConfirmPaymentId(paymentId)
  }

  const handleDuplicateClick = (e: React.MouseEvent, paymentId: string) => {
    e.stopPropagation()
    const source = payments.find((p) => p._id === paymentId)
    if (source) setDuplicateSeed(source)
  }

  const handlePaymentDuplicated = () => {
    setDuplicateSeed(null)
    flashSuccess("Payment duplicated successfully")
  }

  const handlePaymentUpdated = (_updatedPayment: Payment) => {
    // useUpdatePayment invalidates the payments cache automatically.
    flashSuccess("Payment updated successfully")
  }

  const handleEditDeleted = () => {
    setEditPaymentId(null)
    flashSuccess("Payment deleted successfully")
  }

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmPaymentId) return

    try {
      await deletePayment({ id: deleteConfirmPaymentId })

      setDeleteConfirmPaymentId(null)
      flashSuccess("Payment deleted successfully")
    } catch (err) {
      console.error(`Error deleting payment: ${err}`)
      setActionError(err instanceof Error ? err.message : "An error occurred")
      setDeleteConfirmPaymentId(null)
    }
  }, [deleteConfirmPaymentId, deletePayment, flashSuccess])

  // Enter-to-confirm for the delete modal. ESC is handled by Modal itself.
  useEffect(() => {
    if (!deleteConfirmPaymentId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        handleConfirmDelete()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [deleteConfirmPaymentId, handleConfirmDelete])

  return {
    actionError,
    showSuccess,
    successMessage,
    dismissSuccess: () => setShowSuccess(false),
    isDeleting,
    deleteConfirmPaymentId,
    editPaymentId,
    duplicateSeed,
    handleRowClick,
    closeEditModal: () => setEditPaymentId(null),
    closeDeleteModal: () => setDeleteConfirmPaymentId(null),
    closeDuplicateModal: () => setDuplicateSeed(null),
    handleDeleteClick,
    handleDuplicateClick,
    handlePaymentDuplicated,
    handlePaymentUpdated,
    handleEditDeleted,
    handleConfirmDelete,
  }
}
