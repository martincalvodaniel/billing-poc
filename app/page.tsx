"use client";

import { useEffect, useRef, useState } from "react";
import PaymentForm from "./components/PaymentForm";
import PaymentsList from "./components/PaymentsList";
import NavigationBar from "./components/NavigationBar";

export default function Home() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [paymentsCount, setPaymentsCount] = useState(0);
  const formRef = useRef<{ setFormDate: (dateString: string) => void }>(null);
  const paymentsListRef = useRef<{ refreshPayments: () => void; navigateToMonth: (dateString: string) => void; getFilteredPaymentsCount: () => number }>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showCalendar) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  const handleCalendarMonthSelect = (year: number, month: number) => {
    setSelectedDate(new Date(year, month, 1));
    setShowCalendar(false);
  };

  const handleGoToCurrentMonth = () => {
    if (isViewingCurrentMonth) return;
    setSelectedDate(currentMonthStart);
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
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Overview for {formatMonthYear(selectedDate)} · {paymentsCount} payments</h3>
            </div>
            <div className="flex items-center gap-3" ref={calendarRef}>
              <button
                onClick={handleGoToCurrentMonth}
                disabled={isViewingCurrentMonth}
                aria-label="Go to current month"
                className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 disabled:hover:bg-transparent dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30 dark:focus:ring-offset-zinc-900 dark:disabled:border-zinc-700 dark:disabled:text-zinc-500"
              >
                🎯
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  aria-label={`Select month, currently viewing ${formatMonthYear(selectedDate)}`}
                  aria-expanded={showCalendar}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
                >
                  📅 {formatMonthYear(selectedDate)}
                </button>
                {showCalendar && renderCalendarPicker()}
              </div>
              <button
                type="button"
                onClick={() => handleAddPaymentClick()}
                aria-label="Add payment"
                className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 disabled:hover:bg-transparent dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30 dark:focus:ring-offset-zinc-900 dark:disabled:border-zinc-700 dark:disabled:text-zinc-500"
              >
                <span className="text-white dark:text-white" aria-hidden="true">➕</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <PaymentsList
            ref={paymentsListRef}
            onMonthChange={handleMonthChange}
            selectedDate={selectedDate}
            onPaymentsCountChange={setPaymentsCount}
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
