"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Payment } from "@/lib/types";

export default forwardRef(function PaymentsList(props, ref) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    fetchPayments();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshPayments: fetchPayments,
  }));

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/payments");

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error fetching payments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditDate = (payment: Payment) => {
    setEditingId(payment._id?.toString() || null);
    setEditingDate(payment.date);
  };

  const handleSaveDate = async () => {
    if (!editingId || !editingDate) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, date: editingDate }),
      });

      if (!response.ok) {
        throw new Error("Failed to update date");
      }

      // Update local state
      setPayments((prevPayments) =>
        prevPayments.map((p) =>
          p._id?.toString() === editingId ? { ...p, date: editingDate } : p
        )
      );

      setEditingId(null);
      setEditingDate("");
      setSuccessMessage("Date updated successfully");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error("Error updating date:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingDate("");
  };

  const handleEditType = (payment: Payment) => {
    setEditingTypeId(payment._id?.toString() || null);
    setEditingType(payment.type);
  };

  const handleSaveType = async () => {
    if (!editingTypeId || !editingType) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTypeId, type: editingType }),
      });

      if (!response.ok) {
        throw new Error("Failed to update type");
      }

      // Update local state
      setPayments((prevPayments) =>
        prevPayments.map((p) =>
          p._id?.toString() === editingTypeId ? { ...p, type: editingType as "income" | "outcome" } : p
        )
      );

      setEditingTypeId(null);
      setEditingType("");
      setSuccessMessage("Type updated successfully");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error("Error updating type:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTypeEdit = () => {
    setEditingTypeId(null);
    setEditingType("");
  };

  const totalIncome = payments
    .filter((p) => p.type === "income")
    .reduce((sum, p) => sum + p.total, 0);

  const totalOutcome = payments
    .filter((p) => p.type === "outcome")
    .reduce((sum, p) => sum + p.total, 0);

  const netBalance = totalIncome - totalOutcome;

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
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 shadow-lg dark:border-green-800 dark:from-green-950/90 dark:to-emerald-950/90">
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
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
              className="ml-auto text-green-600 hover:text-green-700 dark:text-green-400"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Income</p>
          <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Outcome</p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalOutcome)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Net Balance</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              netBalance >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="w-full rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Payments ({payments.length})
          </h2>
        </div>

        {error && (
          <div className="m-6 rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {payments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No payments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Net Amount
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    VAT
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment._id?.toString()}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                      {editingId === payment._id?.toString() ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={editingDate}
                            onChange={(e) => setEditingDate(e.target.value)}
                            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
                          />
                          <button
                            onClick={handleSaveDate}
                            disabled={isSaving}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="rounded bg-zinc-300 px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditDate(payment)}
                          className="text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                        >
                          {formatDate(payment.date)}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingTypeId === payment._id?.toString() ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingType}
                            onChange={(e) => setEditingType(e.target.value)}
                            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
                          >
                            <option value="income">Income</option>
                            <option value="outcome">Outcome</option>
                          </select>
                          <button
                            onClick={handleSaveType}
                            disabled={isSaving}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={handleCancelTypeEdit}
                            disabled={isSaving}
                            className="rounded bg-zinc-300 px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditType(payment)}
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium hover:opacity-80 ${
                            payment.type === "income"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {payment.type.charAt(0).toUpperCase() +
                            payment.type.slice(1)}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.netAmount)}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.vat)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});
