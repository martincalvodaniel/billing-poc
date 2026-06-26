import type { WordPressOrderStatus } from "@/lib/domain/entities/wordpress-order"

const WORDPRESS_PAGE_SIZE = 5

export function buildWordPressOrdersUrl(
  endpoint: string,
  page: number
): string {
  const normalizedEndpoint = endpoint.replace(/\/$/, "")
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(WORDPRESS_PAGE_SIZE),
  })
  return `${normalizedEndpoint}/wc/v3/orders?${params.toString()}`
}

export function buildWordPressOrderUrl(
  endpoint: string,
  orderId: number
): string {
  const normalizedEndpoint = endpoint.replace(/\/$/, "")
  return `${normalizedEndpoint}/wc/v3/orders/${orderId}`
}

export function buildWordPressCouponsUrl(
  endpoint: string,
  page?: number
): string {
  const normalizedEndpoint = endpoint.replace(/\/$/, "")
  if (page === undefined) {
    return `${normalizedEndpoint}/wc/v3/coupons`
  }
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(WORDPRESS_PAGE_SIZE),
  })
  return `${normalizedEndpoint}/wc/v3/coupons?${params.toString()}`
}

export function buildWordPressCouponUrl(
  endpoint: string,
  couponId: number
): string {
  return `${buildWordPressCouponsUrl(endpoint)}/${couponId}`
}

export function buildWordPressOrderStatusPayload(
  status: WordPressOrderStatus
): {
  status: WordPressOrderStatus
} {
  return { status }
}
