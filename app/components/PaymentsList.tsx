"use client";

import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Payment } from "@/lib/types";

export default forwardRef(function PaymentsList(props, ref) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string>("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string>("");
  const [availableTagsForEdit, setAvailableTagsForEdit] = useState<string[]>([]);
  const [suggestedTagsForEdit, setSuggestedTagsForEdit] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  
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

  const fetchTagsByType = async (paymentType: string) => {
    try {
      const response = await fetch(`/api/tags?type=${paymentType}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTagsForEdit(data.tags || []);
      }
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  };

  const handleEditTag = (payment: Payment) => {
    setEditingTagId(payment._id?.toString() || null);
    setEditingTag(payment.tag || "");
    fetchTagsByType(payment.type);
    setSuggestedTagsForEdit([]);
  };

  const handleTagInputChange = (value: string) => {
    setEditingTag(value);
    setShowTagSuggestions(true);

    // Clear existing timer
    if (tagDebounceTimer.current) {
      clearTimeout(tagDebounceTimer.current);
    }

    // Set new timer for 1 second delay
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

  const handleSaveTag = async () => {
    if (!editingTagId) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTagId, tag: editingTag }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tag");
      }

      // Update local state
      setPayments((prevPayments) =>
        prevPayments.map((p) =>
          p._id?.toString() === editingTagId ? { ...p, tag: editingTag || undefined } : p
        )
      );

      // Add new tag to available tags if it's not already there
      if (editingTag && !availableTagsForEdit.includes(editingTag)) {
        setAvailableTagsForEdit((prev) => [...prev, editingTag].sort());
      }

      setEditingTagId(null);
      setEditingTag("");
      setSuccessMessage("Tag updated successfully");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error("Error updating tag:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTagEdit = () => {
    setEditingTagId(null);
    setEditingTag("");
    setShowTagSuggestions(false);
    setSuggestedTagsForEdit([]);
  };

  const handleTagBlur = () => {
    // Delay closing suggestions to allow click on suggestion
    setTimeout(() => {
      setShowTagSuggestions(false);
    }, 200);
  };

  const filteredPayments = getFilteredPayments();

  const totalIncome = filteredPayments
    .filter((p) => p.type === "income")
    .reduce((sum, p) => sum + p.total, 0);

  const totalOutcome = filteredPayments
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
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                      {editingTagId === payment._id?.toString() ? (
                        <div className="relative flex flex-col gap-2">
                          <div className="flex items-center gap-2">
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
                              onBlur={handleTagBlur}
                              placeholder="e.g., Client A, Rent, etc."
                              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
                            />
                            <button
                              onClick={handleSaveTag}
                              disabled={isSaving}
                              className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700"
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelTagEdit}
                              disabled={isSaving}
                              className="rounded bg-zinc-300 px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100"
                            >
                              Cancel
                            </button>
                          </div>

                          {/* Tag Suggestions Dropdown */}
                          {showTagSuggestions && suggestedTagsForEdit.length > 0 && (
                            <div className="absolute top-full left-0 right-auto z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
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
                      ) : (
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
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.total)}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.vat)}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.netAmount)}
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
