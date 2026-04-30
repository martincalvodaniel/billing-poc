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
    .min(1, "Tax ID is required")
    .transform((v) => v.trim()),
  address: z
    .string()
    .min(1, "Address is required")
    .transform((v) => v.trim()),
  phone: z.string().optional(),
  email: z.string().optional(),
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
      .min(1, "Tax ID cannot be empty")
      .transform((v) => v.trim())
      .optional(),
    address: z
      .string()
      .min(1, "Address cannot be empty")
      .transform((v) => v.trim())
      .optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
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
