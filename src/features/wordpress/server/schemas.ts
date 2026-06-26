import { z } from "zod"

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

export const rawOrderSchema = z.object({
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

export const rawOrdersSchema = z.array(rawOrderSchema)

export const rawCouponSchema = z.object({
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

export const rawCouponsSchema = z.array(rawCouponSchema)

export type RawOrder = z.infer<typeof rawOrderSchema>
export type RawCoupon = z.infer<typeof rawCouponSchema>
