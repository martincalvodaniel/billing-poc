import { formatCurrency } from "@/lib/formatters"
import SummaryCard from "../../components/SummaryCard"

export default function PaymentsSummary({
  totalIncome,
  totalOutcome,
  netBalance,
  incomeCount,
  outcomeCount,
}: {
  totalIncome: number
  totalOutcome: number
  netBalance: number
  incomeCount: number
  outcomeCount: number
}) {
  const cards = [
    {
      label: `Income (${incomeCount})`,
      value: formatCurrency(totalIncome),
      className: "text-green-600 dark:text-green-400",
    },
    {
      label: `Outcome (${outcomeCount})`,
      value: formatCurrency(totalOutcome),
      className: "text-red-600 dark:text-red-400",
    },
    {
      label: "Net",
      value: formatCurrency(netBalance),
      className:
        netBalance >= 0
          ? "text-blue-600 dark:text-blue-400"
          : "text-red-600 dark:text-red-400",
    },
  ]

  return (
    <>
      {/* Mobile: horizontal scroll chips */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:hidden">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {card.label}
            </span>
            <span className={`text-sm font-bold ${card.className}`}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop: full grid */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-3">
        {cards.map((card) => (
          <SummaryCard
            key={card.label}
            label={card.label}
            value={card.value}
            valueClassName={card.className}
          />
        ))}
      </div>
    </>
  )
}
