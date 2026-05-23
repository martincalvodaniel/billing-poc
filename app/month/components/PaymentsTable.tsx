import { TrashIcon } from "@/app/components/icons/TrashIcon"
import { formatCurrency, formatMonthYear } from "@/lib/formatters"
import type { Payment } from "@/lib/types"

export default function PaymentsTable({
  payments,
  filteredPayments,
  selectedDate,
  error,
  onRowClick,
  onDeleteClick,
}: {
  payments: Payment[]
  filteredPayments: Payment[]
  selectedDate: Date
  error: string | null
  onRowClick: (paymentId: string) => void
  onDeleteClick: (e: React.MouseEvent, paymentId: string) => void
}) {
  const hasSurcharge = filteredPayments.some(
    (p) => p.surcharge && p.surcharge > 0
  )

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {error && (
        <div
          className="m-6 rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">No payments yet</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            No payments in {formatMonthYear(selectedDate)}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  Day
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  Type
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  Tag
                </th>
                <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                  Total
                </th>
                <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                  VAT
                </th>
                {hasSurcharge && (
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Surcharge
                  </th>
                )}
                <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                  Net
                </th>
                <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr
                  key={payment._id?.toString()}
                  onClick={() => onRowClick(payment._id?.toString() || "")}
                  className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                    {new Date(payment.date).getDate()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        payment.type === "income"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {payment.type.charAt(0).toUpperCase() +
                        payment.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                    {payment.tag ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {payment.tag}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500 dark:text-zinc-500">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(payment.total)}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    ({payment.vat}%) {formatCurrency(payment.vatAmount)}
                  </td>
                  {hasSurcharge && (
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {payment.surcharge && payment.surcharge > 0 ? (
                        <span>
                          ({payment.surcharge}%){" "}
                          {formatCurrency(payment.surchargeAmount || 0)}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">
                          —
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(payment.netAmount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) =>
                        onDeleteClick(e, payment._id?.toString() || "")
                      }
                      aria-label="Delete payment"
                      className="rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300 dark:focus:ring-offset-zinc-900"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
