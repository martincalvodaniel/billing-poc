import { getWordPressPagination } from "@/features/wordpress/server/pagination"
import {
  projectCoupon,
  projectOrder,
} from "@/features/wordpress/server/projections"
import {
  rawCouponSchema,
  rawCouponsSchema,
  rawOrderSchema,
  rawOrdersSchema,
} from "@/features/wordpress/server/schemas"
import {
  fetchWordPressJson,
  getWordPressCredentials,
} from "@/features/wordpress/server/transport"
import {
  buildWordPressCouponsUrl,
  buildWordPressCouponUrl,
  buildWordPressOrderStatusPayload,
  buildWordPressOrdersUrl,
  buildWordPressOrderUrl,
} from "@/features/wordpress/server/urls"
import type {
  CreateWordPressCouponInput,
  WordPressCoupon,
  WordPressCouponsResponse,
} from "@/lib/domain/entities/wordpress-coupon"
import type {
  WordPressOrder,
  WordPressOrderStatus,
  WordPressOrdersResponse,
} from "@/lib/domain/entities/wordpress-order"
import { buildWordPressCouponPayload } from "@/lib/domain/services/wordpress-coupon"

export async function fetchWordPressOrdersPage(
  page: number
): Promise<WordPressOrdersResponse> {
  const { endpoint } = getWordPressCredentials()
  const { data, response } = await fetchWordPressJson(
    buildWordPressOrdersUrl(endpoint, page),
    { method: "GET" },
    "WordPress orders request failed",
    rawOrdersSchema,
    "WordPress orders payload validation failed"
  )

  return {
    items: data.map(projectOrder),
    pagination: getWordPressPagination(response, page, data.length),
  }
}

export async function fetchWordPressCouponsPage(
  page: number
): Promise<WordPressCouponsResponse> {
  const { endpoint } = getWordPressCredentials()
  const { data, response } = await fetchWordPressJson(
    buildWordPressCouponsUrl(endpoint, page),
    { method: "GET" },
    "WordPress coupons request failed",
    rawCouponsSchema,
    "WordPress coupons payload validation failed"
  )

  return {
    items: data.map(projectCoupon),
    pagination: getWordPressPagination(response, page, data.length),
  }
}

export async function fetchWordPressCoupon(
  couponId: number
): Promise<WordPressCoupon> {
  const { endpoint } = getWordPressCredentials()
  const { data } = await fetchWordPressJson(
    buildWordPressCouponUrl(endpoint, couponId),
    { method: "GET" },
    "WordPress coupon request failed",
    rawCouponSchema,
    "WordPress coupon payload validation failed"
  )

  return projectCoupon(data)
}

export async function createWordPressCoupon(
  input: CreateWordPressCouponInput
): Promise<WordPressCoupon> {
  const { endpoint } = getWordPressCredentials()
  const { data } = await fetchWordPressJson(
    buildWordPressCouponsUrl(endpoint),
    {
      method: "POST",
      body: JSON.stringify(buildWordPressCouponPayload(input)),
    },
    "WordPress coupon creation failed",
    rawCouponSchema,
    "WordPress coupon creation payload validation failed"
  )

  return projectCoupon(data)
}

export async function deleteWordPressCoupon(
  couponId: number
): Promise<WordPressCoupon> {
  const { endpoint } = getWordPressCredentials()
  const { data } = await fetchWordPressJson(
    buildWordPressCouponUrl(endpoint, couponId),
    { method: "DELETE" },
    "WordPress coupon deletion failed",
    rawCouponSchema,
    "WordPress coupon deletion payload validation failed"
  )

  return projectCoupon(data)
}

export async function updateWordPressOrderStatus(
  orderId: number,
  status: WordPressOrderStatus
): Promise<WordPressOrder> {
  const { endpoint } = getWordPressCredentials()
  const { data } = await fetchWordPressJson(
    buildWordPressOrderUrl(endpoint, orderId),
    {
      method: "PUT",
      body: JSON.stringify(buildWordPressOrderStatusPayload(status)),
    },
    "WordPress order update failed",
    rawOrderSchema,
    "WordPress order update payload validation failed"
  )

  return projectOrder(data)
}
