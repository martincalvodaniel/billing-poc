"use client";

import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { Payment } from "@/lib/types";
import DonutChart from "../../components/DonutChart";
import SummaryCard from "../../components/SummaryCard";
import Modal from "../../components/Modal";
import PaymentDetailModal from "./PaymentDetailModal";

export default forwardRef(function MonthlyPaymentsView(
  props: { onMonthChange?: (dateString: string) => void; selectedDate: Date },
  ref
) {
  const { onMonthChange, selectedDate } = props;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Delete confirmation state
  const [deleteConfirmPaymentId, setDeleteConfirmPaymentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit modal state (full payment edit)
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);

  const fetchPayments = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      
      const response = await fetch(`/api/payments?year=${year}&month=${month}`, {
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      if (!signal?.aborted) {
        setPayments(data.payments || []);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted, ignore
        return;
      }
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      if (!signal?.aborted) {
        setError(errorMessage);
      }
      console.error(`Error fetching payments: ${err}`);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchPayments(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchPayments]);

  // Notify parent when month changes so form date can be synced
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    onMonthChange?.(dateString);
  }, [selectedDate, onMonthChange]);

  useImperativeHandle(ref, () => ({
    refreshPayments: () => fetchPayments(),
    navigateToMonth: () => {
      // Month navigation is now handled by parent component via selectedDate prop
    },
    getFilteredPaymentsCount: () => getFilteredPayments().length,
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const groupPaymentsByTag = (list: Payment[], paymentType: Payment["type"]) => {
    return list
      .filter((payment) => payment.type === paymentType)
      .reduce((acc, payment) => {
        const tag = payment.tag || "Untagged";
        acc[tag] = (acc[tag] || 0) + payment.total;
        return acc;
      }, {} as Record<string, number>);
  };

  const getFilteredPayments = () => {
    // No client-side filtering needed since API returns only relevant month's payments
    return payments;
  };

  const handleRowClick = (paymentId: string) => {
    setEditPaymentId(paymentId);
  };

  const closeEditModal = () => {
    setEditPaymentId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, paymentId: string) => {
    e.stopPropagation(); // Prevent row click
    setDeleteConfirmPaymentId(paymentId);
  };

  const handlePaymentUpdated = (updatedPayment: Payment) => {
    setPayments((prevPayments) =>
      prevPayments.map((p) =>
        p._id?.toString() === updatedPayment._id?.toString() ? updatedPayment : p
      )
    );
    setSuccessMessage("Payment updated successfully");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmPaymentId) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteConfirmPaymentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete payment");
      }

      // Remove payment from local state
      setPayments((prevPayments) =>
        prevPayments.filter((p) => p._id?.toString() !== deleteConfirmPaymentId)
      );

      setDeleteConfirmPaymentId(null);
      setSuccessMessage("Payment deleted successfully");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error(`Error deleting payment: ${err}`);
      setError(err instanceof Error ? err.message : "An error occurred");
      setDeleteConfirmPaymentId(null);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmPaymentId]);

  const handleDeleteModalKeyDown = useCallback((e: KeyboardEvent) => {
    if (deleteConfirmPaymentId) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirmPaymentId(null);
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleConfirmDelete();
      }
    }
  }, [deleteConfirmPaymentId, handleConfirmDelete]);

  // Register keyboard handler for delete modal
  useEffect(() => {
    if (!deleteConfirmPaymentId) return;

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleDeleteModalKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleDeleteModalKeyDown);
    };
  }, [deleteConfirmPaymentId, handleDeleteModalKeyDown]);

  const filteredPayments = getFilteredPayments();

  const totalIncome = filteredPayments
    .filter((p) => p.type === "income")
    .reduce((sum, p) => sum + p.total, 0);

  const totalOutcome = filteredPayments
    .filter((p) => p.type === "outcome")
    .reduce((sum, p) => sum + p.total, 0);

  const netBalance = totalIncome - totalOutcome;

  const incomeByTag = groupPaymentsByTag(filteredPayments, "income");
  const outcomeByTag = groupPaymentsByTag(filteredPayments, "outcome");

  // Year-level aggregations
  // Generate colors for chart segments
  const colors = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6"
  ];

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed left-1/2 top-8 z-50 -translate-x-1/2 animate-[slideDown_0.3s_ease-out]">
          <div 
            className="flex items-center gap-3 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 shadow-lg dark:border-green-800 dark:from-green-950/90 dark:to-emerald-950/90"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              {successMessage}
            </span>
            <button
              onClick={() => setShowSuccess(false)}
              aria-label="Close notification"
              className="ml-auto rounded-md p-1 text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-green-400 dark:hover:text-green-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label={`Total Income (${filteredPayments.filter((p) => p.type === "income").length})`}
          value={formatCurrency(totalIncome)}
          valueClassName="text-green-600 dark:text-green-400"
        />
        <SummaryCard
          label={`Total Outcome (${filteredPayments.filter((p) => p.type === "outcome").length})`}
          value={formatCurrency(totalOutcome)}
          valueClassName="text-red-600 dark:text-red-400"
        />
        <SummaryCard
          label="Net Balance"
          value={formatCurrency(netBalance)}
          valueClassName={
            netBalance >= 0
              ? "text-blue-600 dark:text-blue-400"
              : "text-red-600 dark:text-red-400"
          }
        />
      </div>

      {/* Donut Charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <DonutChart data={incomeByTag} title="Income by Tag" colors={colors} />
        <DonutChart data={outcomeByTag} title="Outcome by Tag" colors={colors} />
      </div>

      {/* Payments Table */}
      <div className="w-full rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {error && (
          <div 
            className="m-6 rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            {error}
          </div>
        )}

        {payments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No payments yet</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No payments in {formatMonthYear(selectedDate)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Tag
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    VAT
                  </th>
                  {filteredPayments.some(p => p.surcharge && p.surcharge > 0) && (
                    <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      Surcharge
                    </th>
                  )}
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Net
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment._id?.toString()}
                    onClick={() => handleRowClick(payment._id?.toString() || "")}
                    className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                      {new Date(payment.date).getDate()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          payment.type === "income"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {payment.type.charAt(0).toUpperCase() +
                          payment.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                      {payment.tag ? (
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {payment.tag}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.total)}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      ({payment.vat}%) {formatCurrency(payment.vatAmount)}
                    </td>
                    {filteredPayments.some(p => p.surcharge && p.surcharge > 0) && (
                      <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {payment.surcharge && payment.surcharge > 0 ? (
                          <span>({payment.surcharge}%) {formatCurrency(payment.surchargeAmount || 0)}</span>
                        ) : (
                          <span className="text-xs text-zinc-500 dark:text-zinc-500">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.netAmount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => handleDeleteClick(e, payment._id?.toString() || "")}
                        aria-label="Delete payment"
                        className="rounded px-2 py-1 text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:text-red-400 dark:hover:text-red-300 dark:focus:ring-offset-zinc-900"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmPaymentId && (() => {
        const paymentToDelete = payments.find(p => p._id?.toString() === deleteConfirmPaymentId);
        return (
          <Modal
            isOpen={!!deleteConfirmPaymentId}
            onClose={() => setDeleteConfirmPaymentId(null)}
            title="Delete Payment"
            maxWidth="sm"
            footer={
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirmPaymentId(null)}
                  disabled={isDeleting}
                  className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              <p>Are you sure you want to delete this payment?</p>
              {paymentToDelete && (
                <div className="mt-4 space-y-3 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Date:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(paymentToDelete.date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Type:</span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      paymentToDelete.type === "income"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {paymentToDelete.type.charAt(0).toUpperCase() + paymentToDelete.type.slice(1)}
                    </span>
                  </div>
                  {paymentToDelete.tag && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Tag:</span>
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {paymentToDelete.tag}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-zinc-600 dark:text-zinc-400">Total:</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(paymentToDelete.total)}</span>
                  </div>
                </div>
              )}
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This action cannot be undone.
              </p>
            </div>
          </Modal>
        );
      })()}

      {/* Payment Edit Modal */}
      {editPaymentId && (() => {
        const selectedPayment = payments.find(p => p._id?.toString() === editPaymentId);
        if (!selectedPayment) return null;
        return (
          <PaymentDetailModal
            payment={selectedPayment}
            onClose={closeEditModal}
            onUpdate={handlePaymentUpdated}
            formatCurrency={formatCurrency}
          />
        );
      })()}
    </div>
  );
});
