"use client";

import { Payment } from "@/lib/types";

interface PaymentDetailModalProps {
  payment: Payment;
  onClose: () => void;
  formatCurrency?: (amount: number) => string;
}

export default function PaymentDetailModal({ payment, onClose, formatCurrency }: PaymentDetailModalProps) {
  const currency = (amount: number) =>
    formatCurrency
      ? formatCurrency(amount)
      : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const computedVatPercent = payment.netAmount > 0 ? ((payment.vat / payment.netAmount) * 100).toFixed(2) : "0.00";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white shadow-lg dark:bg-zinc-900"
        role="dialog"
        aria-labelledby="payment-detail-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 id="payment-detail-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Payment Details
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment details"
            className="rounded p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus:ring-offset-zinc-900"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Date</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(payment.date)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Type</p>
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                  payment.type === "income"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Tag</p>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">{payment.tag || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Total</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{currency(payment.total)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">VAT</p>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">
                ({computedVatPercent}%) {currency(payment.vat)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Net Amount</p>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">{currency(payment.netAmount)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payment Components</p>
            {payment.concepts && payment.concepts.length > 0 ? (
              <ul className="space-y-2">
                {payment.concepts.map((c, idx) => (
                  <li key={idx} className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                        {idx + 1}
                      </span>
                      <span className="truncate text-zinc-900 dark:text-zinc-100">{c.name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {typeof c.vat === "number" && (
                        <span className="whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">VAT {c.vat}%</span>
                      )}
                      <span className="whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">{currency(c.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No components</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
