import { z } from "zod"

const conceptSchema = z.object({
  name: z.string().min(1, "Concept name is required"),
  amount: z.coerce.number({ message: "Invalid concept amount" }),
  quantity: z.coerce.number().default(1),
})

const paymentBaseSchema = z.object({
  type: z.enum(["income", "outcome"]),
  date: z.string().min(1, "Date is required"),
  concepts: z.array(conceptSchema).min(1, "At least one concept is required"),
  vat: z.coerce
    .number({ message: "Invalid VAT percentage" })
    .min(0, "VAT must be between 0 and 100")
    .max(100, "VAT must be between 0 and 100"),
  surcharge: z.coerce
    .number()
    .min(0, "Surcharge must be between 0 and 100")
    .max(100, "Surcharge must be between 0 and 100")
    .optional()
    .default(0),
  tag: z.string().optional(),
  clientId: z.string().optional(),
  deliveryNoteRef: z.string().optional(),
})

export const createPaymentSchema = paymentBaseSchema

export const updatePaymentSchema = z
  .object({
    id: z.string().min(1, "Missing payment ID"),
    type: z.enum(["income", "outcome"]).optional(),
    date: z.string().min(1, "Date cannot be empty").optional(),
    concepts: z
      .array(conceptSchema)
      .min(1, "At least one concept is required")
      .optional(),
    vat: z.coerce
      .number({ message: "Invalid VAT percentage" })
      .min(0, "VAT must be between 0 and 100")
      .max(100, "VAT must be between 0 and 100")
      .optional(),
    surcharge: z.coerce
      .number()
      .min(0, "Surcharge must be between 0 and 100")
      .max(100, "Surcharge must be between 0 and 100")
      .optional(),
    tag: z.string().optional(),
    clientId: z.string().nullable().optional(),
    deliveryNoteRef: z.string().optional(),
    total: z.coerce.number().optional(),
  })
  .refine(
    (data) => {
      const { id: _id, ...rest } = data
      return Object.values(rest).some((v) => v !== undefined)
    },
    { message: "No fields to update" }
  )

export const deletePaymentSchema = z.object({
  id: z.string().min(1, "Missing payment ID"),
})

export const paymentQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce
    .number()
    .int()
    .min(1, "Invalid month")
    .max(12, "Invalid month")
    .optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
export type DeletePaymentInput = z.infer<typeof deletePaymentSchema>
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>
