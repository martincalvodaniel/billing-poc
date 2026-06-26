import { sanitizeWordPressBilling } from "@/features/wordpress/server/sanitize"
import type { RawCoupon, RawOrder } from "@/features/wordpress/server/schemas"
import type { WordPressCoupon } from "@/lib/domain/entities/wordpress-coupon"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"

export function projectOrder(order: RawOrder): WordPressOrder {
  return {
    id: order.id,
    status: order.status,
    prices_include_tax: order.prices_include_tax,
    discount_total: order.discount_total,
    discount_tax: order.discount_tax,
    cart_tax: order.cart_tax,
    total: order.total,
    total_tax: order.total_tax,
    billing: sanitizeWordPressBilling(order.billing),
    payment_method: order.payment_method,
    payment_method_title: order.payment_method_title,
    date_completed: order.date_completed,
    date_paid: order.date_paid,
    line_items: order.line_items,
    tax_lines: order.tax_lines,
    needs_payment: order.needs_payment,
    needs_processing: order.needs_processing,
    date_created_gmt: order.date_created_gmt,
    date_modified_gmt: order.date_modified_gmt,
    date_completed_gmt: order.date_completed_gmt,
    date_paid_gmt: order.date_paid_gmt,
    currency_symbol: order.currency_symbol,
  }
}

export function projectCoupon(coupon: RawCoupon): WordPressCoupon {
  return {
    id: coupon.id,
    code: coupon.code,
    amount: coupon.amount,
    status: coupon.status,
    description: coupon.description,
    date_expires_gmt: coupon.date_expires_gmt,
    usage_count: coupon.usage_count,
    usage_limit: coupon.usage_limit,
    used_by: coupon.used_by,
  }
}
