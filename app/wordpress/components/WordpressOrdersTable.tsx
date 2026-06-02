import { Badge } from "@/app/components/Badge"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"
import {
  formatAmount,
  formatOrderDate,
  formatOrderTime,
  getOrderStatusTone,
} from "./wordpress-view-utils"

interface WordpressOrdersTableProps {
  orders: WordPressOrder[]
  onSelectOrder: (order: WordPressOrder) => void
  onSelectBilling: (order: WordPressOrder) => void
}

export function WordpressOrdersTable({
  orders,
  onSelectOrder,
  onSelectBilling,
}: WordpressOrdersTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {orders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => onSelectOrder(order)}
            className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
            aria-label={`Open order ${order.id} details`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  #{order.id}
                </p>
                <Badge tone={getOrderStatusTone(order.status)} size="sm">
                  {order.status}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {formatAmount(order.total)}
              </p>
            </div>

            <div className="mt-3 space-y-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectBilling(order)
                }}
                className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                aria-label={`Import billing data for order ${order.id}`}
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {order.billing.first_name} {order.billing.last_name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {order.billing.phone} - {order.billing.email}
                </p>
              </button>
            </div>

            <div className="mt-3 border-t border-zinc-200 pt-3 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
              <p>
                {formatOrderDate(order.date_paid || order.date_completed)} -{" "}
                {formatOrderTime(order.date_paid || order.date_completed)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700 md:block">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Billing
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Paid Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                onClick={() => onSelectOrder(order)}
              >
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      #{order.id}
                    </p>
                    <Badge tone={getOrderStatusTone(order.status)} size="sm">
                      {order.status}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelectBilling(order)
                    }}
                    className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                    aria-label={`Import billing data for order ${order.id}`}
                  >
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {order.billing.first_name} {order.billing.last_name}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {order.billing.phone} - {order.billing.email}
                    </p>
                  </button>
                </td>
                <td className="px-4 py-3 align-top text-sm text-zinc-900 dark:text-zinc-100">
                  {formatAmount(order.total)}
                </td>
                <td className="px-4 py-3 align-top text-sm text-zinc-900 dark:text-zinc-100">
                  <p>
                    {formatOrderDate(order.date_paid || order.date_completed)}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {formatOrderTime(order.date_paid || order.date_completed)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
