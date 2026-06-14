import { z } from "zod"
import { buildAccentInsensitivePattern } from "@/lib/utils/text-search"

const productNameSchema = z.string().trim().min(1, "Name is required")

function requiredNumberSchema<T extends z.ZodNumber>(
  schema: T
): z.ZodType<number> {
  return z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined
    }
    return value
  }, z.coerce.number().pipe(schema)) as z.ZodType<number>
}

const productPriceSchema = requiredNumberSchema(
  z.number().min(0, "Final price must be 0 or greater")
)
const productTaxesSchema = requiredNumberSchema(
  z
    .number()
    .min(0, "Taxes must be between 0 and 100")
    .max(100, "Taxes must be between 0 and 100")
)
const productStockSchema = requiredNumberSchema(
  z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock must be 0 or greater")
)

export const createProductSchema = z.object({
  name: productNameSchema,
  finalPrice: productPriceSchema,
  taxes: productTaxesSchema,
  stock: productStockSchema,
})

export const updateProductSchema = z
  .object({
    id: z.string().min(1, "Missing product ID"),
    name: productNameSchema.optional(),
    finalPrice: productPriceSchema.optional(),
    taxes: productTaxesSchema.optional(),
    stock: productStockSchema.optional(),
  })
  .refine(
    (data) => {
      const { id: _id, ...rest } = data
      return Object.values(rest).some((value) => value !== undefined)
    },
    { message: "No fields to update" }
  )

export const deleteProductSchema = z.object({
  id: z.string().min(1, "Missing product ID"),
})

export const productQuerySchema = z.object({
  search: z.string().optional(),
})

export function buildProductSearchPattern(search: string): string {
  return buildAccentInsensitivePattern(search.trim())
}
