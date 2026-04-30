"use client";

import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Payment } from "@/lib/types";
import DonutChart from "./DonutChart";

type EditField = "date" | "type" | "tag" | "total" | "vat" | null;

export default forwardRef(function PaymentsList(props, ref) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditField>(null);
  const [editingDate, setEditingDate] = useState<string>("");
  const [editingType, setEditingType] = useState<string>("");
  const [editingTag, setEditingTag] = useState<string>("");
  const [editingTotal, setEditingTotal] = useState<string>("");
  const [editingVat, setEditingVat] = useState<string>("");
  
  const [availableTagsForEdit, setAvailableTagsForEdit] = useState<string[]>([]);
  const [suggestedTagsForEdit, setSuggestedTagsForEdit] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Delete confirmation state
  const [deleteConfirmPaymentId, setDeleteConfirmPaymentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Month selection state (initialized to current month)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshPayments: fetchPayments,
    navigateToMonth: (dateString: string) => {
      const date = new Date(dateString);
      setSelectedDate(new Date(date.getFullYear(), date.getMonth(), 1));
    },
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
      console.error(`Error fetching payments: ${err}`);
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

  const getFilteredPayments = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    return payments.filter((payment) => {
      const paymentDate = new Date(payment.date);
      return (
        paymentDate.getFullYear() === year &&
        paymentDate.getMonth() === month
      );
    });
  };

  const handleCalendarMonthSelect = (year: number, month: number) => {
    setSelectedDate(new Date(year, month, 1));
    setShowCalendar(false);
  };

  const renderCalendarPicker = () => {
    return (
      <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        {/* Calendar Header */}
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ← Prev
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {new Date(selectedDate.getFullYear(), selectedDate.getMonth()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </span>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Next →
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, monthIndex) => {
              const year = selectedDate.getFullYear();
              const month = monthIndex;
              const isSelected =
                year === selectedDate.getFullYear() && month === selectedDate.getMonth();

              return (
                <button
                  key={monthIndex}
                  onClick={() => handleCalendarMonthSelect(year, month)}
                  className={`rounded px-2 py-2 text-xs font-medium ${
                    isSelected
                      ? "bg-blue-600 text-white dark:bg-blue-700"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {new Date(year, month).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </button>
              );
            })}
          </div>

          {/* Year Navigation */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear() - 1, selectedDate.getMonth(), 1))}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ← Prev Year
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedDate.getFullYear()}
            </span>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear() + 1, selectedDate.getMonth(), 1))}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Next Year →
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getEditingPayment = () => {
    return payments.find(p => p._id?.toString() === editingPaymentId);
  };

  const closeEditModal = () => {
    setEditingPaymentId(null);
    setEditingField(null);
    setEditingDate("");
    setEditingType("");
    setEditingTag("");
    setEditingTotal("");
    setEditingVat("");
    setShowTagSuggestions(false);
    setSuggestedTagsForEdit([]);
    if (tagDebounceTimer.current) {
      clearTimeout(tagDebounceTimer.current);
    }
  };

  const handleEditDate = (payment: Payment) => {
    setEditingPaymentId(payment._id?.toString() || null);
    setEditingField("date");
    setEditingDate(payment.date);
  };

  const handleEditType = (payment: Payment) => {
    setEditingPaymentId(payment._id?.toString() || null);
    setEditingField("type");
    setEditingType(payment.type);
  };

  const handleEditTag = (payment: Payment) => {
    setEditingPaymentId(payment._id?.toString() || null);
    setEditingField("tag");
    setEditingTag(payment.tag || "");
    fetchTagsByType(payment.type);
    setSuggestedTagsForEdit([]);
  };

  const handleEditTotal = (payment: Payment) => {
    setEditingPaymentId(payment._id?.toString() || null);
    setEditingField("total");
    setEditingTotal(payment.total.toString());
  };

  const handleEditVat = (payment: Payment) => {
    setEditingPaymentId(payment._id?.toString() || null);
    setEditingField("vat");
    const vatPercentage = (payment.vat / payment.netAmount) * 100;
    setEditingVat(vatPercentage.toFixed(2));
  };

  const fetchTagsByType = async (paymentType: string) => {
    try {
      const response = await fetch(`/api/tags?type=${paymentType}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTagsForEdit(data.tags || []);
      }
    } catch (err) {
      console.error(`Error fetching tags: ${err}`);
    }
  };

  const handleTagInputChange = (value: string) => {
    setEditingTag(value);
    setShowTagSuggestions(true);

    if (tagDebounceTimer.current) {
      clearTimeout(tagDebounceTimer.current);
    }

    tagDebounceTimer.current = setTimeout(() => {
      if (value.trim() === "") {
        setSuggestedTagsForEdit(availableTagsForEdit);
      } else {
        const filtered = availableTagsForEdit.filter((tag) =>
          tag.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestedTagsForEdit(filtered);
      }
    }, 1000);
  };

  const handleTagSelect = (tag: string) => {
    setEditingTag(tag);
    setShowTagSuggestions(false);
    setSuggestedTagsForEdit([]);
  };

  const handleDeleteClick = (paymentId: string) => {
    setDeleteConfirmPaymentId(paymentId);
  };

  const handleConfirmDelete = async () => {
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
  };

  const handleSave = async () => {
    if (!editingPaymentId || !editingField) return;

    let payload: Record<string, any> = { id: editingPaymentId };
    let errorMessage = "";

    // Validate based on field type
    if (editingField === "date") {
      if (!editingDate) {
        setError("Date is required");
        return;
      }
      payload.date = editingDate;
    } else if (editingField === "type") {
      if (!editingType) {
        setError("Type is required");
        return;
      }
      payload.type = editingType;
    } else if (editingField === "tag") {
      payload.tag = editingTag;
    } else if (editingField === "total") {
      if (!editingTotal) {
        setError("Total is required");
        return;
      }
      const totalAmount = parseFloat(editingTotal);
      if (isNaN(totalAmount)) {
        setError("Invalid total amount");
        return;
      }
      payload.total = totalAmount;
    } else if (editingField === "vat") {
      if (!editingVat) {
        setError("VAT is required");
        return;
      }
      const vatPercentage = parseFloat(editingVat);
      if (isNaN(vatPercentage) || vatPercentage < 0 || vatPercentage > 100) {
        setError("VAT percentage must be between 0 and 100");
        return;
      }
      payload.vat = vatPercentage;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${editingField}`);
      }

      const responseData = await response.json();

      // Update local state
      setPayments((prevPayments) =>
        prevPayments.map((p) => {
          if (p._id?.toString() === editingPaymentId) {
            if (editingField === "date") {
              return { ...p, date: editingDate };
            } else if (editingField === "type") {
              return { ...p, type: editingType as "income" | "outcome" };
            } else if (editingField === "tag") {
              return { ...p, tag: editingTag || undefined };
            } else if (editingField === "total" || editingField === "vat") {
              return {
                ...p,
                total: responseData.total,
                vat: responseData.vat,
                netAmount: responseData.netAmount,
              };
            }
          }
          return p;
        })
      );

      // Add new tag to available tags if needed
      if (editingField === "tag" && editingTag && !availableTagsForEdit.includes(editingTag)) {
        setAvailableTagsForEdit((prev) => [...prev, editingTag].sort());
      }

      closeEditModal();
      setSuccessMessage(`${editingField.charAt(0).toUpperCase() + editingField.slice(1)} updated successfully`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error(`Error updating ${editingField}: ${err}`);
      errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPayments = getFilteredPayments();

  const totalIncome = filteredPayments
    .filter((p) => p.type === "income")
    .reduce((sum, p) => sum + p.total, 0);

  const totalOutcome = filteredPayments
    .filter((p) => p.type === "outcome")
    .reduce((sum, p) => sum + p.total, 0);

  const netBalance = totalIncome - totalOutcome;

  // Calculate data grouped by tag
  const incomeByTag = filteredPayments
    .filter((p) => p.type === "income")
    .reduce((acc, p) => {
      const tag = p.tag || "Untagged";
      acc[tag] = (acc[tag] || 0) + p.total;
      return acc;
    }, {} as Record<string, number>);

  const outcomeByTag = filteredPayments
    .filter((p) => p.type === "outcome")
    .reduce((acc, p) => {
      const tag = p.tag || "Untagged";
      acc[tag] = (acc[tag] || 0) + p.total;
      return acc;
    }, {} as Record<string, number>);

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

      {/* Donut Charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <DonutChart data={incomeByTag} title="Income by Tag" colors={colors} />
        <DonutChart data={outcomeByTag} title="Outcome by Tag" colors={colors} />
      </div>

      {/* Payments Table */}
      <div className="w-full rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Payments ({filteredPayments.length})
            </h2>
            <div className="relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                📅 {formatMonthYear(selectedDate)}
              </button>
              {showCalendar && renderCalendarPicker()}
            </div>
          </div>
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
                    Date
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
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Net Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment._id?.toString()}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                      <button
                        onClick={() => handleEditDate(payment)}
                        className="text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                      >
                        {formatDate(payment.date)}
                      </button>
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                      <button
                        onClick={() => handleEditTag(payment)}
                        className="text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                      >
                        {payment.tag ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {payment.tag}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500 dark:text-zinc-500">—</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      <button
                        onClick={() => handleEditTotal(payment)}
                        className="text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                      >
                        {formatCurrency(payment.total)}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      <button
                        onClick={() => handleEditVat(payment)}
                        className="text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                      >
                        {formatCurrency(payment.vat)}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.netAmount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteClick(payment._id?.toString() || "")}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete payment"
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

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmPaymentId && (() => {
        const paymentToDelete = payments.find(p => p._id?.toString() === deleteConfirmPaymentId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white shadow-lg dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Delete Payment
                </h3>
              </div>
              <div className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
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
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
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
            </div>
          </div>
        );
      })()}

      {/* Edit Modal Overlay */}
      {editingPaymentId && editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-lg dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Edit {editingField.charAt(0).toUpperCase() + editingField.slice(1)}
              </h3>
            </div>

            <div className="space-y-4 px-6 py-4">
              {editingField === "date" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingDate}
                    onChange={(e) => setEditingDate(e.target.value)}
                    className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              )}

              {editingField === "type" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Type
                  </label>
                  <select
                    value={editingType}
                    onChange={(e) => setEditingType(e.target.value)}
                    className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="income">Income</option>
                    <option value="outcome">Outcome</option>
                  </select>
                </div>
              )}

              {editingField === "tag" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Tag (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingTag}
                      onChange={(e) => handleTagInputChange(e.target.value)}
                      onFocus={() => {
                        setShowTagSuggestions(true);
                        if (!editingTag?.trim()) {
                          setSuggestedTagsForEdit(availableTagsForEdit);
                        }
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowTagSuggestions(false), 200)
                      }
                      placeholder="e.g., Client A, Rent, etc."
                      className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />

                    {/* Tag Suggestions Dropdown */}
                    {showTagSuggestions && suggestedTagsForEdit.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                        <ul className="max-h-48 overflow-y-auto py-1">
                          {suggestedTagsForEdit.map((tag) => (
                            <li key={tag}>
                              <button
                                type="button"
                                onClick={() => handleTagSelect(tag)}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                              >
                                {tag}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editingField === "total" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={editingTotal}
                    onChange={(e) => setEditingTotal(e.target.value)}
                    className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              )}

              {editingField === "vat" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    VAT Percentage
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      max="100"
                      value={editingVat}
                      onChange={(e) => setEditingVat(e.target.value)}
                      className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={closeEditModal}
                disabled={isSaving}
                className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
