import { z } from "zod"
import type {
  WordPressOrder,
  WordPressOrdersResponse,
} from "@/lib/domain/entities/wordpress-order"

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
  const params = new URLSearchParams({ page: String(page) })
  return `${normalizedEndpoint}/wc/v3/orders?${params.toString()}`
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
    billing: order.billing,
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

export async function fetchWordPressOrdersPage(
  page: number
): Promise<WordPressOrdersResponse> {
  const endpoint = getRequiredWordPressEnv("WORDPRESS_ENDPOINT")
  const user = getRequiredWordPressEnv("WORDPRESS_USER")
  const password = getRequiredWordPressEnv("WORDPRESS_PASSWORD")

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
      : parsed.data.length

  return {
    items: parsed.data.map(projectOrder),
    pagination: {
      page,
      total,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
    },
  }
}
