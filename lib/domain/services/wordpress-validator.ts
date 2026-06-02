import { z } from "zod"

export const wordpressOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
})
