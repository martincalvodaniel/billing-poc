import { z } from "zod"

export const wordpressOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
})

export const wordpressOrderParamsSchema = z.object({
  orderId: z.coerce.number().int().min(1),
})

export const updateWordpressOrderStatusSchema = z.object({
  status: z.literal("completed"),
})
