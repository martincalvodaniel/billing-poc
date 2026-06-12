import { formatCurrency } from "@/lib/formatters"
import { useStableCallback } from "@/lib/hooks/useStableCallback"
import SummaryCard from "../../components/SummaryCard"
export default function PaymentsSummary({
  totalIncome,
  totalOutcome,
  totalVat,
  totalVatIncome,
  totalVatOutcome,
  totalNet,
  totalNetIncome,
  totalNetOutcome,
  incomeCount,
  outcomeCount,
  typeFilter,
  onTypeFilterToggle,
}: {
  totalIncome: number
  totalOutcome: number
  totalVat: number
  totalVatIncome: number
  totalVatOutcome: number
  totalNet: number
  totalNetIncome: number
  totalNetOutcome: number
  incomeCount: number
  outcomeCount: number
  typeFilter: "all" | "income" | "outcome"
  onTypeFilterToggle: (type: "income" | "outcome") => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SummaryCard
        label="Total"
        value={formatCurrency(totalIncome - totalOutcome)}
        valueClassName={
          totalIncome - totalOutcome >= 0
            ? "text-blue-600 dark:text-blue-400"
            : "text-red-600 dark:text-red-400"
        }
      >
        <div className="space-y-1 text-xs">
          <SummaryFilterButton
            type="income"
            activeType={typeFilter}
            onToggle={onTypeFilterToggle}
          >
            <span className="text-green-600 dark:text-green-400">
              Income ({incomeCount}): {formatCurrency(totalIncome)}
            </span>
          </SummaryFilterButton>
          <SummaryFilterButton
            type="outcome"
            activeType={typeFilter}
            onToggle={onTypeFilterToggle}
          >
            <span className="text-red-600 dark:text-red-400">
              Outcome ({outcomeCount}): {formatCurrency(totalOutcome)}
            </span>
          </SummaryFilterButton>
        </div>
      </SummaryCard>
      <SummaryCard
        label="Net"
        value={formatCurrency(totalNet)}
        valueClassName={
          totalNet >= 0
            ? "text-blue-600 dark:text-blue-400"
            : "text-red-600 dark:text-red-400"
        }
      >
        <div className="space-y-1 text-xs">
          <SummaryFilterButton
            type="income"
            activeType={typeFilter}
            onToggle={onTypeFilterToggle}
          >
            <span className="text-green-600 dark:text-green-400">
              Income ({incomeCount}): {formatCurrency(totalNetIncome)}
            </span>
          </SummaryFilterButton>
          <SummaryFilterButton
            type="outcome"
            activeType={typeFilter}
            onToggle={onTypeFilterToggle}
          >
            <span className="text-red-600 dark:text-red-400">
              Outcome ({outcomeCount}): {formatCurrency(totalNetOutcome)}
            </span>
          </SummaryFilterButton>
        </div>
      </SummaryCard>
      <SummaryCard
        label="VAT"
        value={formatCurrency(totalVat)}
        valueClassName={
          totalVat >= 0
            ? "text-blue-600 dark:text-blue-400"
            : "text-red-600 dark:text-red-400"
        }
      >
        <div className="space-y-1 text-xs">
          <SummaryFilterButton
            type="income"
            activeType={typeFilter}
            onToggle={onTypeFilterToggle}
          >
            <span className="text-green-600 dark:text-green-400">
              Income ({incomeCount}): {formatCurrency(totalVatIncome)}
            </span>
          </SummaryFilterButton>
          <SummaryFilterButton
            type="outcome"
            activeType={typeFilter}
            onToggle={onTypeFilterToggle}
          >
            <span className="text-red-600 dark:text-red-400">
              Outcome ({outcomeCount}): {formatCurrency(totalVatOutcome)}
            </span>
          </SummaryFilterButton>
        </div>
      </SummaryCard>
    </div>
  )
}

function SummaryFilterButton({
  type,
  activeType,
  onToggle,
  children,
}: {
  type: "income" | "outcome"
  activeType: "all" | "income" | "outcome"
  onToggle: (type: "income" | "outcome") => void
  children: React.ReactNode
}) {
  const handleClick = useStableCallback(() => onToggle(type))
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`block w-full rounded px-1 py-0.5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        activeType === type
          ? "ring-1 ring-blue-500"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
      }`}
      aria-label={`Filter table by ${type} payments`}
    >
      {children}
    </button>
  )
}
