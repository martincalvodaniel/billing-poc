"use client"

interface PaymentTotalsPanelProps {
  surcharge: string
  calculateTotal: () => number
  calculateVatAmount: () => string
  calculateSurchargeAmount: () => string
  calculateNetAmount: () => string
}

export default function PaymentTotalsPanel({
  surcharge,
  calculateTotal,
  calculateVatAmount,
  calculateSurchargeAmount,
  calculateNetAmount,
}: PaymentTotalsPanelProps) {
  const showSurcharge = parseFloat(surcharge || "0") > 0
  return (
    <div className="space-y-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Total from components
        </span>
        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
          €{calculateTotal().toFixed(2)}
        </span>
      </div>
      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700"></div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          VAT Amount
        </span>
        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
          €{calculateVatAmount()}
        </span>
      </div>
      {showSurcharge && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Surcharge Amount
          </span>
          <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
            €{calculateSurchargeAmount()}
          </span>
        </div>
      )}
      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Net Amount (after deductions)
          </span>
          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
            €{calculateNetAmount()}
          </span>
        </div>
      </div>
    </div>
  )
}
