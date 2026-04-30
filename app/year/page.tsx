"use client"

import { useEffect, useMemo, useState } from "react"
import type { Payment } from "@/lib/types"
import DonutChart from "../components/DonutChart"
import PageLayout from "../components/PageLayout"
import SummaryCard from "../components/SummaryCard"
import MonthlyBreakdown from "./components/MonthlyBreakdown"
import YearSelector from "./components/YearSelector"

export default function YearSummaryPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear()
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const abortController = new AbortController()

    const fetchPayments = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/payments?year=${selectedYear}`, {
          signal: abortController.signal,
        })
        if (!response.ok) {
          throw new Error("Failed to fetch payments")
        }
        const data = await response.json()
        if (!abortController.signal.aborted) {
          setPayments(data.payments || [])
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, ignore
          return
        }
        const message = err instanceof Error ? err.message : "An error occurred"
        if (!abortController.signal.aborted) {
          setError(message)
        }
        console.error(`Error fetching payments: ${err}`)
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchPayments()

    return () => {
      abortController.abort()
    }
  }, [selectedYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const isViewingCurrentYear = selectedYear === currentYear

  const paymentsForYear = useMemo(
    () => payments, // API already filters by year
    [payments]
  )

  // Combine iterations: compute monthly buckets and tag breakdowns in a single pass (js-combine-iterations)
  const {
    monthlyTotals,
    incomeByTagYear,
    outcomeByTagYear,
    incomeCount,
    outcomeCount,
  } = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, monthIndex) => ({
      monthIndex,
      income: 0,
      outcome: 0,
    }))
    const incByTag: Record<string, number> = {}
    const outByTag: Record<string, number> = {}
    let incCount = 0
    let outCount = 0

    for (const payment of paymentsForYear) {
      const paymentMonth = new Date(payment.date).getMonth()
      const bucket = buckets[paymentMonth]
      const tag = payment.tag || "Untagged"
      if (payment.type === "income") {
        bucket.income += payment.total
        incByTag[tag] = (incByTag[tag] || 0) + payment.total
        incCount++
      } else {
        bucket.outcome += payment.total
        outByTag[tag] = (outByTag[tag] || 0) + payment.total
        outCount++
      }
    }

    return {
      monthlyTotals: buckets.map((b) => ({
        ...b,
        net: b.income - b.outcome,
        totalVolume: b.income + b.outcome,
      })),
      incomeByTagYear: incByTag,
      outcomeByTagYear: outByTag,
      incomeCount: incCount,
      outcomeCount: outCount,
    }
  }, [paymentsForYear])

  const yearlyIncome = monthlyTotals.reduce(
    (sum, month) => sum + month.income,
    0
  )
  const yearlyOutcome = monthlyTotals.reduce(
    (sum, month) => sum + month.outcome,
    0
  )
  const yearlyNet = yearlyIncome - yearlyOutcome
  const maxMonthlyVolume = Math.max(
    1,
    ...monthlyTotals.map((month) => month.totalVolume)
  )

  const colors = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
    "#6366f1",
    "#14b8a6",
  ]

  return (
    <PageLayout
      title="Yearly Overview"
      subtitle="Explore income and outcome performance across the year"
      navigationSubtitle="Yearly Overview"
      headerContent={
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Yearly Filter
            </p>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Overview for {selectedYear}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <YearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              isViewingCurrentYear={isViewingCurrentYear}
              onGoToCurrentYear={() => {
                if (!isViewingCurrentYear) {
                  setSelectedYear(currentYear)
                }
              }}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label={`Total Income (${incomeCount})`}
            value={formatCurrency(yearlyIncome)}
            valueClassName="text-green-600 dark:text-green-400"
          />
          <SummaryCard
            label={`Total Outcome (${outcomeCount})`}
            value={formatCurrency(yearlyOutcome)}
            valueClassName="text-red-600 dark:text-red-400"
          />
          <SummaryCard
            label="Net Balance"
            value={formatCurrency(yearlyNet)}
            valueClassName={
              yearlyNet >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-600 dark:text-red-400"
            }
          />
        </div>

        {paymentsForYear.length === 0 ? (
          <div className="rounded-md bg-zinc-50 p-6 text-center text-sm text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
            No payments recorded in {selectedYear}.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <DonutChart
                data={incomeByTagYear}
                title={`Income by Tag (${selectedYear})`}
                colors={colors}
              />
              <DonutChart
                data={outcomeByTagYear}
                title={`Outcome by Tag (${selectedYear})`}
                colors={colors}
              />
            </div>

            <MonthlyBreakdown
              monthlyTotals={monthlyTotals}
              selectedYear={selectedYear}
              formatCurrency={formatCurrency}
              maxMonthlyVolume={maxMonthlyVolume}
            />
          </div>
        )}

        {error && (
          <div
            className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            {error}
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        )}
      </div>
    </PageLayout>
  )
}
