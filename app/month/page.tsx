"use client";

import { useRef, useState } from "react";
import PaymentForm from "./components/PaymentForm";
import MonthlyPaymentsView from "./components/MonthlyPaymentsView";
import NavigationBar from "../components/NavigationBar";
import MonthSelector from "./components/MonthSelector";

export default function Home() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const formRef = useRef<{ setFormDate: (dateString: string) => void }>(null);
  const paymentsListRef = useRef<{ refreshPayments: () => void; navigateToMonth: (dateString: string) => void; getFilteredPaymentsCount: () => number }>(null);

  const currentMonthDate = new Date();
  const currentMonthStart = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
  const isViewingCurrentMonth =
    selectedDate.getFullYear() === currentMonthStart.getFullYear() &&
    selectedDate.getMonth() === currentMonthStart.getMonth();

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

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

  const handleCalendarMonthSelect = (year: number, month: number) => {
    setSelectedDate(new Date(year, month, 1));
  };

  const handleGoToCurrentMonth = () => {
    if (isViewingCurrentMonth) return;
    setSelectedDate(currentMonthStart);
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl space-y-8 py-12">
        <NavigationBar subtitle="Monthly Payments" />

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Monthly Overview
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Manage your income and outcome payments
          </p>
        </div>

        {/* Month Selector */}
        <div className="space-y-6 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Monthly Filter</p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Overview for {formatMonthYear(selectedDate)}</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleAddPaymentClick()}
                aria-label="Add payment"
                className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 disabled:hover:bg-transparent dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30 dark:focus:ring-offset-zinc-900 dark:disabled:border-zinc-700 dark:disabled:text-zinc-500"
              >
                <span className="text-white dark:text-white" aria-hidden="true">➕</span>
              </button>
              <button
                onClick={handleGoToCurrentMonth}
                disabled={isViewingCurrentMonth}
                aria-label="Go to current month"
                className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 disabled:hover:bg-transparent dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30 dark:focus:ring-offset-zinc-900 dark:disabled:border-zinc-700 dark:disabled:text-zinc-500"
              >
                🎯
              </button>
              <MonthSelector
                selectedDate={selectedDate}
                onMonthChange={handleCalendarMonthSelect}
                showCalendar={showCalendar}
                onShowCalendarChange={setShowCalendar}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <MonthlyPaymentsView
            ref={paymentsListRef}
            onMonthChange={handleMonthChange}
            selectedDate={selectedDate}
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
