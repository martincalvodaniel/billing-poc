"use client";

import { useRef } from "react";
import PaymentForm from "./components/PaymentForm";
import PaymentsList from "./components/PaymentsList";

export default function Home() {
  const paymentsListRef = useRef<{ refreshPayments: () => void; navigateToMonth: (dateString: string) => void }>(null);

  const handlePaymentSaved = (date: string) => {
    paymentsListRef.current?.refreshPayments();
    paymentsListRef.current?.navigateToMonth(date);
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl space-y-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Billing System
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Manage your income and outcome payments
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <PaymentForm onPaymentSaved={handlePaymentSaved} />
          </div>

          {/* Payments List Section */}
          <div className="lg:col-span-2">
            <PaymentsList ref={paymentsListRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
