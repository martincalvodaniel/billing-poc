import { z } from "zod"
import type {
  CreateWordPressCouponInput,
  WordPressCoupon,
  WordPressCouponsResponse,
} from "@/lib/domain/entities/wordpress-coupon"
import type {
  WordPressBilling,
  WordPressOrder,
  WordPressOrderStatus,
  WordPressOrdersResponse,
} from "@/lib/domain/entities/wordpress-order"
import { buildWordPressCouponPayload } from "@/lib/domain/services/wordpress-coupon"

const stringLikeSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return ""
    return String(value)
  })

const booleanLikeSchema = z
  .union([z.boolean(), z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value === "boolean") return value
    if (typeof value === "number") return value !== 0
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()
      if (normalized === "true" || normalized === "1") return true
      if (normalized === "false" || normalized === "0" || normalized === "") {
        return false
      }
    }
    return false
  })

const rawLineItemTaxSchema = z.object({
  id: z.coerce.number().int(),
  total: stringLikeSchema,
  subtotal: stringLikeSchema,
})

const rawLineItemImageSchema = z.object({
  id: stringLikeSchema,
  src: stringLikeSchema,
})

const rawLineItemSchema = z.object({
  name: stringLikeSchema,
  quantity: z.coerce.number().int(),
  subtotal: stringLikeSchema,
  subtotal_tax: stringLikeSchema,
  total: stringLikeSchema,
  total_tax: stringLikeSchema,
  taxes: z.array(rawLineItemTaxSchema).default([]),
  sku: stringLikeSchema,
  price: z.coerce.number(),
  image: rawLineItemImageSchema.nullish().transform((value) => {
    return value ?? { id: "", src: "" }
  }),
})

const rawTaxLineSchema = z.object({
  id: z.coerce.number().int(),
  rate_code: stringLikeSchema,
  rate_id: z.coerce.number().int(),
  label: stringLikeSchema,
  compound: booleanLikeSchema,
  tax_total: stringLikeSchema,
  shipping_tax_total: stringLikeSchema,
  rate_percent: z.coerce.number(),
})

const rawBillingSchema = z.object({
  first_name: stringLikeSchema,
  last_name: stringLikeSchema,
  address_1: stringLikeSchema,
  address_2: stringLikeSchema,
  city: stringLikeSchema,
  postcode: stringLikeSchema,
  country: stringLikeSchema,
  email: stringLikeSchema,
  phone: stringLikeSchema,
})

const rawOrderSchema = z.object({
  id: z.coerce.number().int(),
  status: stringLikeSchema,
  prices_include_tax: booleanLikeSchema,
  discount_total: stringLikeSchema,
  discount_tax: stringLikeSchema,
  cart_tax: stringLikeSchema,
  total: stringLikeSchema,
  total_tax: stringLikeSchema,
  billing: rawBillingSchema,
  payment_method: stringLikeSchema,
  payment_method_title: stringLikeSchema,
  date_completed: stringLikeSchema,
  date_paid: stringLikeSchema,
  line_items: z.array(rawLineItemSchema).default([]),
  tax_lines: z.array(rawTaxLineSchema).default([]),
  needs_payment: booleanLikeSchema,
  needs_processing: booleanLikeSchema,
  date_created_gmt: stringLikeSchema,
  date_modified_gmt: stringLikeSchema,
  date_completed_gmt: stringLikeSchema,
  date_paid_gmt: stringLikeSchema,
  currency_symbol: stringLikeSchema,
})

const rawOrdersSchema = z.array(rawOrderSchema)

const rawCouponSchema = z.object({
  id: z.coerce.number().int(),
  code: stringLikeSchema,
  amount: stringLikeSchema,
  status: stringLikeSchema,
  description: stringLikeSchema,
  date_expires_gmt: stringLikeSchema,
  usage_count: z.coerce.number().int(),
  usage_limit: z.coerce.number().int(),
  used_by: z.array(stringLikeSchema).default([]),
})

const rawCouponsSchema = z.array(rawCouponSchema)

const WORDPRESS_PAGE_SIZE = 5

export class WordPressApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = "WordPressApiError"
    this.status = status
  }
}

function getRequiredWordPressEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new WordPressApiError(
      `${name} environment variable is required for WordPress integration`,
      500
    )
  }
  return value.trim()
}

export function buildWordPressBasicAuthHeader(
  user: string,
  password: string
): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`
}

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

export function toCapitalCase(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("es-ES")
    .replace(/(^|[\s'-])(\p{L})/gu, (_match, separator, letter) => {
      return `${separator}${letter.toLocaleUpperCase("es-ES")}`
    })
}

export function sanitizeWordPressPhone(value: string): string {
  return value
    .trim()
    .replace(/^\+34\s*/, "")
    .replace(/(\d)\s+(?=\d)/g, "$1")
}

export function sanitizeWordPressBilling(
  billing: WordPressBilling
): WordPressBilling {
  return {
    ...billing,
    first_name: toCapitalCase(billing.first_name),
    last_name: toCapitalCase(billing.last_name),
    phone: sanitizeWordPressPhone(billing.phone),
  }
}

function projectOrder(order: z.infer<typeof rawOrderSchema>): WordPressOrder {
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

function projectCoupon(
  coupon: z.infer<typeof rawCouponSchema>
): WordPressCoupon {
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

function getWordPressCredentials() {
  return {
    endpoint: getRequiredWordPressEnv("WORDPRESS_ENDPOINT"),
    user: getRequiredWordPressEnv("WORDPRESS_USER"),
    password: getRequiredWordPressEnv("WORDPRESS_PASSWORD"),
  }
}

function getWordPressPagination(
  response: Response,
  page: number,
  fallbackTotal: number
) {
  const headerTotalPages = Number(
    response.headers.get("x-wp-totalpages") ?? "0"
  )
  const headerTotal = Number(response.headers.get("x-wp-total") ?? "0")
  const totalPages =
    Number.isFinite(headerTotalPages) && headerTotalPages > 0
      ? headerTotalPages
      : 1
  const total =
    Number.isFinite(headerTotal) && headerTotal >= 0
      ? headerTotal
      : fallbackTotal

  return {
    page,
    total,
    totalPages,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
}

export async function fetchWordPressOrdersPage(
  page: number
): Promise<WordPressOrdersResponse> {
  const { endpoint, user, password } = getWordPressCredentials()

  const response = await fetch(buildWordPressOrdersUrl(endpoint, page), {
    method: "GET",
    headers: {
      Authorization: buildWordPressBasicAuthHeader(user, password),
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "")
    const suffix = bodyText.length > 0 ? `: ${bodyText}` : ""
    throw new WordPressApiError(
      `WordPress orders request failed with status ${response.status}${suffix}`,
      response.status
    )
  }

  const rawData = await response.json()
  const parsed = rawOrdersSchema.safeParse(rawData)

  if (!parsed.success) {
    throw new WordPressApiError(
      "WordPress orders payload validation failed",
      502
    )
  }

  return {
    items: parsed.data.map(projectOrder),
    pagination: getWordPressPagination(response, page, parsed.data.length),
  }
}

export async function fetchWordPressCouponsPage(
  page: number
): Promise<WordPressCouponsResponse> {
  const { endpoint, user, password } = getWordPressCredentials()
  const response = await fetch(buildWordPressCouponsUrl(endpoint, page), {
    method: "GET",
    headers: {
      Authorization: buildWordPressBasicAuthHeader(user, password),
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "")
    const suffix = bodyText.length > 0 ? `: ${bodyText}` : ""
    throw new WordPressApiError(
      `WordPress coupons request failed with status ${response.status}${suffix}`,
      response.status
    )
  }

  const rawData = await response.json()
  const parsed = rawCouponsSchema.safeParse(rawData)
  if (!parsed.success) {
    throw new WordPressApiError(
      "WordPress coupons payload validation failed",
      502
    )
  }

  return {
    items: parsed.data.map(projectCoupon),
    pagination: getWordPressPagination(response, page, parsed.data.length),
  }
}

export async function createWordPressCoupon(
  input: CreateWordPressCouponInput
): Promise<WordPressCoupon> {
  const { endpoint, user, password } = getWordPressCredentials()
  const response = await fetch(buildWordPressCouponsUrl(endpoint), {
    method: "POST",
    headers: {
      Authorization: buildWordPressBasicAuthHeader(user, password),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildWordPressCouponPayload(input)),
    cache: "no-store",
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "")
    const suffix = bodyText.length > 0 ? `: ${bodyText}` : ""
    throw new WordPressApiError(
      `WordPress coupon creation failed with status ${response.status}${suffix}`,
      response.status
    )
  }

  const parsed = rawCouponSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new WordPressApiError(
      "WordPress coupon creation payload validation failed",
      502
    )
  }
  return projectCoupon(parsed.data)
}

export async function deleteWordPressCoupon(
  couponId: number
): Promise<WordPressCoupon> {
  const { endpoint, user, password } = getWordPressCredentials()
  const response = await fetch(buildWordPressCouponUrl(endpoint, couponId), {
    method: "DELETE",
    headers: {
      Authorization: buildWordPressBasicAuthHeader(user, password),
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "")
    const suffix = bodyText.length > 0 ? `: ${bodyText}` : ""
    throw new WordPressApiError(
      `WordPress coupon deletion failed with status ${response.status}${suffix}`,
      response.status
    )
  }

  const parsed = rawCouponSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new WordPressApiError(
      "WordPress coupon deletion payload validation failed",
      502
    )
  }
  return projectCoupon(parsed.data)
}

export async function updateWordPressOrderStatus(
  orderId: number,
  status: WordPressOrderStatus
): Promise<WordPressOrder> {
  const { endpoint, user, password } = getWordPressCredentials()

  const response = await fetch(buildWordPressOrderUrl(endpoint, orderId), {
    method: "PUT",
    headers: {
      Authorization: buildWordPressBasicAuthHeader(user, password),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildWordPressOrderStatusPayload(status)),
    cache: "no-store",
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "")
    const suffix = bodyText.length > 0 ? `: ${bodyText}` : ""
    throw new WordPressApiError(
      `WordPress order update failed with status ${response.status}${suffix}`,
      response.status
    )
  }

  const rawData = await response.json()
  const parsed = rawOrderSchema.safeParse(rawData)

  if (!parsed.success) {
    throw new WordPressApiError(
      "WordPress order update payload validation failed",
      502
    )
  }

  return projectOrder(parsed.data)
}
