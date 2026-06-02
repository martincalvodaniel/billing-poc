import { z } from "zod"
import { WORDPRESS_ORDER_STATUSES } from "@/lib/domain/entities/wordpress-order"

export const wordpressOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
})

export const wordpressOrderParamsSchema = z.object({
  orderId: z.coerce.number().int().min(1),
})

export const updateWordpressOrderStatusSchema = z.object({
  status: z.enum(WORDPRESS_ORDER_STATUSES),
})
