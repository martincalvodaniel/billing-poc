import { z } from "zod"
import { WORDPRESS_ORDER_STATUSES } from "@/lib/domain/entities/wordpress-order"

export const wordpressOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
})

export const wordpressCouponsQuerySchema = wordpressOrdersQuerySchema

export const wordpressOrderParamsSchema = z.object({
  orderId: z.coerce.number().int().min(1),
})

export const wordpressCouponParamsSchema = z.object({
  couponId: z.coerce.number().int().min(1),
})

export const wordpressCouponPdfQuerySchema = z.object({
  expires: z.iso.date(),
})

export const updateWordpressOrderStatusSchema = z.object({
  status: z.enum(WORDPRESS_ORDER_STATUSES),
})

export const createWordpressCouponSchema = z.object({
  description: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  dateExpires: z.iso.date(),
})
