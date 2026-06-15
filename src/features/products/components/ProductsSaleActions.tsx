"use client"

import { LocalSaleIcon } from "@/components/ui/icons/LocalSaleIcon"
import { MarketSaleIcon } from "@/components/ui/icons/MarketSaleIcon"

interface ProductsSaleActionsProps {
  selectedCount: number
  hasSelection: boolean
  onLocalSaleClick: () => void
  onMarketSaleClick: () => void
}

const saleActionButtonClass =
  "inline-flex min-h-11 min-w-11 items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"

export default function ProductsSaleActions({
  selectedCount,
  hasSelection,
  onLocalSaleClick,
  onMarketSaleClick,
}: ProductsSaleActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        {selectedCount} selected
      </span>
      <button
        type="button"
        aria-label="Create payment with LocalSale tag"
        title={
          hasSelection
            ? "Create payment with LocalSale"
            : "Select one or more products first"
        }
        onClick={onLocalSaleClick}
        disabled={!hasSelection}
        className={saleActionButtonClass}
      >
        <LocalSaleIcon />
        <span>Local</span>
      </button>
      <button
        type="button"
        aria-label="Create payment with MarketSale tag"
        title={
          hasSelection
            ? "Create payment with MarketSale"
            : "Select one or more products first"
        }
        onClick={onMarketSaleClick}
        disabled={!hasSelection}
        className={saleActionButtonClass}
      >
        <MarketSaleIcon />
        <span>Market</span>
      </button>
    </div>
  )
}
