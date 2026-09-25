"use client"

import { useMemo } from "react"
import PageLayout from "@/components/shared/PageLayout"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { useInvoiceCounters } from "../hooks/useInvoiceCounters"
import {
  formatInvoiceCounter,
  groupInvoiceCountersByYear,
} from "./invoice-counter-groups"

export default function InvoicesPageContent() {
  const { counters, error, isLoading } = useInvoiceCounters()
  const yearGroups = useMemo(
    () => groupInvoiceCountersByYear(counters),
    [counters]
  )
  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? "Failed to fetch invoice numbering"
        : null

  return (
    <PageLayout
      navigationSubtitle="Invoices"
      headerContent={
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Billing records
          </p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Invoice numbering
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Current sequence number for every generated invoice series, grouped
            by year.
          </p>
        </div>
      }
    >
      {errorMessage ? <ErrorBanner bordered>{errorMessage}</ErrorBanner> : null}

      {isLoading && yearGroups.length === 0 ? (
        <EmptyState variant="card">Loading invoice numbering...</EmptyState>
      ) : yearGroups.length === 0 ? (
        <EmptyState variant="card">
          No numbered invoices have been generated yet.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {yearGroups.map((group) => (
            <section
              key={group.year}
              aria-label={`Invoice numbering for ${group.year}`}
              className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {group.year}
                </h2>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                {group.counters.map((counter) => (
                  <article
                    key={counter.series}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {counter.label}
                      </h3>
                      <span className="rounded bg-zinc-200 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        {counter.prefix}
                      </span>
                    </div>
                    <p className="mt-5 font-mono text-3xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                      {formatInvoiceCounter(counter.lastNumber)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {counter.lastNumber === 0
                        ? "No invoices issued"
                        : "Last assigned number"}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
