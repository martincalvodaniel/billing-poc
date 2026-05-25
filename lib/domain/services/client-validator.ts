import { z } from "zod"

export const createClientSchema = z.object({
  clientType: z.enum(["individual", "company"], {
    message: "clientType must be 'individual' or 'company'",
  }),
  name: z
    .string()
    .min(1, "Name is required")
    .transform((v) => v.trim()),
  taxId: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = v?.trim()
      return trimmed ? trimmed : undefined
    }),
  address: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = v?.trim()
      return trimmed ? trimmed : undefined
    }),
  phone: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = v?.trim()
      return trimmed ? trimmed : undefined
    }),
  email: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = v?.trim()
      return trimmed ? trimmed : undefined
    }),
})

export const updateClientSchema = z
  .object({
    id: z.string().min(1, "Missing client ID"),
    clientType: z
      .enum(["individual", "company"], {
        message: "clientType must be 'individual' or 'company'",
      })
      .optional(),
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .transform((v) => v.trim())
      .optional(),
    taxId: z
      .string()
      .optional()
      .transform((v) => {
        const trimmed = v?.trim()
        return trimmed ? trimmed : undefined
      }),
    address: z
      .string()
      .optional()
      .transform((v) => {
        const trimmed = v?.trim()
        return trimmed ? trimmed : undefined
      }),
    phone: z
      .string()
      .optional()
      .transform((v) => {
        const trimmed = v?.trim()
        return trimmed ? trimmed : undefined
      }),
    email: z
      .string()
      .optional()
      .transform((v) => {
        const trimmed = v?.trim()
        return trimmed ? trimmed : undefined
      }),
  })
  .refine(
    (data) => {
      const { id: _id, ...rest } = data
      return Object.values(rest).some((v) => v !== undefined)
    },
    { message: "No fields to update" }
  )

export const deleteClientSchema = z.object({
  id: z.string().min(1, "Missing client ID"),
})

export const clientQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type DeleteClientInput = z.infer<typeof deleteClientSchema>
export type ClientQueryInput = z.infer<typeof clientQuerySchema>
