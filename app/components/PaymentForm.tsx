"use client";

import { useState, useEffect, useRef } from "react";
import { PaymentFormData } from "@/lib/types";

interface PaymentFormProps {
  onPaymentSaved?: (date: string) => void;
}

export default function PaymentForm({ onPaymentSaved }: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    date: new Date().toISOString().split("T")[0],
    total: "",
    vat: "21",
    type: "income",
    tag: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch available tags on component mount and when type changes
  const fetchTagsByType = async (paymentType: string) => {
    try {
      const response = await fetch(`/api/tags?type=${paymentType}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags || []);
      }
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  };

  useEffect(() => {
    fetchTagsByType(formData.type);
  }, [formData.type]);

  // Refetch tags when window regains focus to stay in sync with list edits
  useEffect(() => {
    const handleFocus = () => {
      fetchTagsByType(formData.type);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save payment");
      }

      // Add new tag to available tags if it's not already there
      if (formData.tag && !availableTags.includes(formData.tag)) {
        setAvailableTags((prev) => [...prev, formData.tag!].sort());
      }

      // Reset total amount while keeping type and date sticky
      setFormData((prev) => ({
        ...prev,
        total: "",
        tag: "",
      }));

      // Show success toast
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      
      onPaymentSaved?.(formData.date);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error saving payment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Handle tag suggestions with debounce
    if (name === "tag") {
      setShowTagSuggestions(true);

      // Clear existing timer
      if (tagDebounceTimer.current) {
        clearTimeout(tagDebounceTimer.current);
      }

      // Set new timer for 1 second delay
      tagDebounceTimer.current = setTimeout(() => {
        if (value.trim() === "") {
          setSuggestedTags(availableTags);
        } else {
          const filtered = availableTags.filter((tag) =>
            tag.toLowerCase().includes(value.toLowerCase())
          );
          setSuggestedTags(filtered);
        }
      }, 1000);
    }
  };

  const calculateVatAmount = () => {
    const total = parseFloat(formData.total) || 0;
    const vatPercentage = parseFloat(formData.vat) || 0;
    const net = total / (1 + vatPercentage / 100);
    return (total - net).toFixed(2);
  };

  const calculateNetAmount = () => {
    const total = parseFloat(formData.total) || 0;
    const vatPercentage = parseFloat(formData.vat) || 0;
    return (total / (1 + vatPercentage / 100)).toFixed(2);
  };

  const handleTagSelect = (tag: string) => {
    setFormData((prev) => ({ ...prev, tag }));
    setShowTagSuggestions(false);
    setSuggestedTags([]);
  };

  const handleTagBlur = () => {
    // Delay closing suggestions to allow click on suggestion
    setTimeout(() => {
      setShowTagSuggestions(false);
    }, 200);
  };

  return (
    <>
      {/* Success Toast Notification */}
      {showSuccess && (
        <div className="fixed left-1/2 top-8 z-50 -translate-x-1/2 animate-[slideDown_0.3s_ease-out]">
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 shadow-lg dark:border-green-800 dark:from-green-950/90 dark:to-emerald-950/90">
            {/* Success Icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            {/* Message */}
            <div className="flex flex-col">
              <p className="font-semibold text-green-900 dark:text-green-100">
                Payment saved successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your payment has been recorded.
              </p>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-4 flex-shrink-0 rounded-md p-1 text-green-600 transition-colors hover:bg-green-100 hover:text-green-800 dark:text-green-400 dark:hover:bg-green-900 dark:hover:text-green-200"
              aria-label="Close notification"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          New Payment
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Add a new income or outcome entry
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Payment Type */}
        <div className="space-y-2">
          <label
            htmlFor="type"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          >
            <option value="income">Income</option>
            <option value="outcome">Outcome</option>
          </select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>

        {/* Tag with Autocomplete */}
        <div className="relative space-y-2">
          <label
            htmlFor="tag"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Tag (Optional)
          </label>
          <input
            type="text"
            id="tag"
            name="tag"
            value={formData.tag || ""}
            onChange={handleChange}
            onFocus={() => {
              setShowTagSuggestions(true);
              if (formData.tag?.trim() === "") {
                setSuggestedTags(availableTags);
              }
            }}
            onBlur={handleTagBlur}
            placeholder="e.g., Client A, Rent, etc."
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />

          {/* Tag Suggestions Dropdown */}
          {showTagSuggestions && suggestedTags.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              <ul className="max-h-48 overflow-y-auto py-1">
                {suggestedTags.map((tag) => (
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

        {/* Total Amount (with VAT) */}
        <div className="space-y-2">
          <label
            htmlFor="total"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Total Amount (with VAT)
          </label>
          <input
            type="number"
            id="total"
            name="total"
            value={formData.total}
            onChange={handleChange}
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>

        {/* VAT Percentage */}
        <div className="space-y-2">
          <label
            htmlFor="vat"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            VAT (%)
          </label>
          <input
            type="number"
            id="vat"
            name="vat"
            value={formData.vat}
            onChange={handleChange}
            step="0.5"
            min="0"
            max="100"
            placeholder="0"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>

        {/* VAT Amount and Net Amount (calculated) */}
        <div className="space-y-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              VAT Amount
            </span>
            <span className="text-lg font-semibold text-red-600 dark:text-red-400">
              €{calculateVatAmount()}
            </span>
          </div>
          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Net Amount (after deductions)
              </span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                €{calculateNetAmount()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? "Saving..." : "Save Payment"}
      </button>
    </form>
    </>
  );
}
