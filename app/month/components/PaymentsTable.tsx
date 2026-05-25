import { Badge } from "@/app/components/Badge"
import { EmptyState } from "@/app/components/EmptyState"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import { IconButton } from "@/app/components/IconButton"
import { DuplicateIcon } from "@/app/components/icons/DuplicateIcon"
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
  onDuplicateClick,
}: {
  payments: Payment[]
  filteredPayments: Payment[]
  selectedDate: Date
  error: string | null
  onRowClick: (paymentId: string) => void
  onDeleteClick: (e: React.MouseEvent, paymentId: string) => void
  onDuplicateClick: (e: React.MouseEvent, paymentId: string) => void
}) {
  const hasSurcharge = filteredPayments.some(
    (p) => p.surcharge && p.surcharge > 0
  )

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {error && <ErrorBanner className="m-6">{error}</ErrorBanner>}

      {payments.length === 0 ? (
        <EmptyState variant="inline" className="px-6 py-12">
          No payments yet
        </EmptyState>
      ) : filteredPayments.length === 0 ? (
        <EmptyState variant="inline" className="px-6 py-12">
          No payments in {formatMonthYear(selectedDate)}
        </EmptyState>
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
                <th />
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
                    <Badge
                      tone={payment.type === "income" ? "success" : "danger"}
                    >
                      {payment.type.charAt(0).toUpperCase() +
                        payment.type.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                    {payment.tag ? (
                      <Badge tone="info">{payment.tag}</Badge>
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
                    <div className="inline-flex items-center justify-end gap-1">
                      <IconButton
                        variant="info"
                        stopPropagation
                        onClick={(e) =>
                          onDuplicateClick(e, payment._id?.toString() || "")
                        }
                        ariaLabel="Duplicate payment"
                      >
                        <DuplicateIcon />
                      </IconButton>
                      <IconButton
                        variant="danger"
                        stopPropagation
                        onClick={(e) =>
                          onDeleteClick(e, payment._id?.toString() || "")
                        }
                        ariaLabel="Delete payment"
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
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
