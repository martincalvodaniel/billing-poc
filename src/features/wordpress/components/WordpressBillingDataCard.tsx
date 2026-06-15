import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"
import {
  getBillingName,
  normalizeField,
} from "./wordpress-billing-client-utils"

interface WordpressBillingDataCardProps {
  order: WordPressOrder
}

export function WordpressBillingDataCard({
  order,
}: WordpressBillingDataCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
        Billing data from WordPress
      </h3>
      <div className="mt-2 space-y-1 text-sm text-zinc-900 dark:text-zinc-100">
        <p>{getBillingName(order)}</p>
        <p>{normalizeField(order.billing.phone)}</p>
        <p>{normalizeField(order.billing.email)}</p>
      </div>
    </div>
  )
}
