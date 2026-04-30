"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import PaymentForm from "./components/PaymentForm";
import PaymentsList from "./components/PaymentsList";

export default function Home() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const formRef = useRef<{ setFormDate: (dateString: string) => void }>(null);
  const paymentsListRef = useRef<{ refreshPayments: () => void; navigateToMonth: (dateString: string) => void }>(null);

  const handlePaymentSaved = (date: string) => {
    formRef.current?.setFormDate(date);
    paymentsListRef.current?.refreshPayments();
    paymentsListRef.current?.navigateToMonth(date);
    setShowPaymentModal(false);
  };

  const handleMonthChange = (dateString: string) => {
    formRef.current?.setFormDate(dateString);
  };

  const handleAddPaymentClick = () => {
    setShowPaymentModal(true);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl space-y-8 py-12">
        <nav className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Billing</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Payments</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-blue-300 dark:hover:bg-blue-900/30 dark:focus:ring-offset-zinc-900"
              aria-current="page"
            >
              Monthly list
            </Link>
            <Link
              href="/year"
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
            >
              Year summary
            </Link>
          </div>
        </nav>

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Billing System
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Manage your income and outcome payments
          </p>
        </div>

        <div className="grid gap-8">
          <PaymentsList
            ref={paymentsListRef}
            onMonthChange={handleMonthChange}
            onAddPaymentClick={handleAddPaymentClick}
          />
        </div>
      </main>

      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 py-10"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) handleCloseModal();
          }}
        >
          <div
            className="relative w-full max-w-xl pt-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close add payment modal"
              className="absolute right-3 top-3 rounded-full p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus:ring-offset-zinc-900"
            >
              ✕
            </button>
            <PaymentForm ref={formRef} onPaymentSaved={handlePaymentSaved} />
          </div>
        </div>
      )}
    </div>
  );
}
