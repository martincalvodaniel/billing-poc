import { Modal } from "@/app/components/Modal"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"
import { formatAmount } from "./wordpress-view-utils"

interface WordpressOrderDetailsModalProps {
  order: WordPressOrder | null
  onClose: () => void
}
export function WordpressOrderDetailsModal({
  order,
  onClose,
}: WordpressOrderDetailsModalProps) {
  return (
    <Modal
      isOpen={order !== null}
      onClose={onClose}
      title={order ? `Order #${order.id} details` : "Order details"}
      maxWidth="xl"
    >
      {order ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Billing
              </h3>
              <div className="mt-2 space-y-1 text-sm text-zinc-800 dark:text-zinc-100">
                <p>
                  {order.billing.first_name} {order.billing.last_name}
                </p>
                <p>{order.billing.address_1}</p>
                {order.billing.address_2.length > 0 ? (
                  <p>{order.billing.address_2}</p>
                ) : null}
                <p>
                  {order.billing.postcode} {order.billing.city}
                </p>
                <p>{order.billing.country}</p>
                <p>{order.billing.email}</p>
                <p>{order.billing.phone}</p>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Order totals
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-zinc-600 dark:text-zinc-300">
                  Subtotal taxes
                </dt>
                <dd className="text-right text-zinc-900 dark:text-zinc-100">
                  {formatAmount(order.cart_tax)}
                </dd>
                <dt className="text-zinc-600 dark:text-zinc-300">Discount</dt>
                <dd className="text-right text-zinc-900 dark:text-zinc-100">
                  {formatAmount(order.discount_total)}
                </dd>
                <dt className="text-zinc-600 dark:text-zinc-300">Total tax</dt>
                <dd className="text-right text-zinc-900 dark:text-zinc-100">
                  {formatAmount(order.total_tax)}
                </dd>
                <dt className="text-zinc-600 dark:text-zinc-300">Total</dt>
                <dd className="text-right text-zinc-900 dark:text-zinc-100">
                  {formatAmount(order.total)}
                </dd>
              </dl>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Line items
            </h3>
            {order.line_items.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                No line items
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        Item
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        SKU
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        Total
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        Tax
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                    {order.line_items.map((item) => {
                      return (
                        <tr key={`${item.sku}-${item.name}-${item.quantity}`}>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                            {item.sku}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-zinc-900 dark:text-zinc-100">
                            {formatAmount(item.total)}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-zinc-900 dark:text-zinc-100">
                            {formatAmount(item.total_tax)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Tax lines
            </h3>
            {order.tax_lines.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                No tax lines
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        Tax
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        Rate
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                    {order.tax_lines.map((taxLine) => {
                      return (
                        <tr key={taxLine.id}>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
                            {taxLine.label}
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                            {taxLine.rate_code} ({taxLine.rate_percent}%)
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-zinc-900 dark:text-zinc-100">
                            {formatAmount(taxLine.tax_total)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  )
}
