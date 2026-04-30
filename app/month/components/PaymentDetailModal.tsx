"use client";

import { Payment } from "@/lib/types";
import Modal from "@/app/components/Modal";

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

  return (
    <Modal
      isOpen={payment !== undefined}
      onClose={onClose}
      title="Payment Details"
      maxWidth="lg"
      closeOnEscape={true}
      closeOnEnter={true}
      closeOnBackdropClick={true}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
        >
          Close
        </button>
      }
    >
      <div className="space-y-4">
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
              ({payment.vat}%) {currency(payment.vatAmount)}
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
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-zinc-900 dark:text-zinc-100">{c.name || "—"}</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {c.quantity > 1 ? `Qty: ${c.quantity}` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">{currency(c.amount * c.quantity)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No components</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
