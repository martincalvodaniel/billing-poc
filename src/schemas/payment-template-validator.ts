import { z } from "zod"
import { PAYMENT_METHODS } from "@/lib/domain/entities/payment"

const conceptSchema = z.object({
  productId: z.string().optional(),
  name: z.string().trim().min(1, "Concept name is required"),
  amount: z.coerce.number({ message: "Invalid concept amount" }),
  quantity: z.coerce.number().default(1),
})

const optionalTextSchema = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : undefined
  })

const templateBaseSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(120),
  type: z.enum(["income", "outcome"]),
  concepts: z.array(conceptSchema).min(1, "At least one concept is required"),
  vat: z.coerce
    .number({ message: "Invalid VAT percentage" })
    .min(0, "VAT must be between 0 and 100")
    .max(100, "VAT must be between 0 and 100"),
  surcharge: z.coerce
    .number()
    .min(-100, "Surcharge must be between -100 and 100")
    .max(100, "Surcharge must be between -100 and 100")
    .optional()
    .default(0),
  discount: z.coerce
    .number()
    .min(0, "Discount must be non-negative")
    .optional()
    .default(0),
  tag: optionalTextSchema,
  clientId: optionalTextSchema,
  deliveryNoteRef: optionalTextSchema,
  paymentMethod: z
    .union([z.enum(PAYMENT_METHODS), z.literal(""), z.undefined()])
    .optional()
    .transform((value) => (value ? value : undefined)),
})

export const createPaymentTemplateSchema = templateBaseSchema.superRefine(
  (data, ctx) => {
    const conceptsTotal = data.concepts.reduce(
      (sum, concept) => sum + concept.amount * (concept.quantity ?? 1),
      0
    )
    if (data.discount > conceptsTotal) {
      ctx.addIssue({
        code: "custom",
        path: ["discount"],
        message: "Discount cannot exceed concepts total",
      })
    }
  }
)

export const paymentTemplateQuerySchema = z.object({})
