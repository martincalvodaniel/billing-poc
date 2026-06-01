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
}

export function WordpressOrdersTable({
  orders,
  onSelectOrder,
}: WordpressOrdersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
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
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {order.billing.first_name} {order.billing.last_name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {order.billing.phone} - {order.billing.email}
                </p>
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
  )
}
