import { z } from "zod"

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

function buildStockNumberSchema() {
  return z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock must be 0 or greater")
}

function createStockSchema(): z.ZodType<number | undefined> {
  return z.preprocess((value) => {
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined
    }
    if (typeof value === "string") {
      return Number(value.trim())
    }
    return value
  }, buildStockNumberSchema().optional()) as z.ZodType<number | undefined>
}

function updateStockSchema(): z.ZodType<number | null | undefined> {
  return z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return null
    }
    if (typeof value === "string") {
      return Number(value.trim())
    }
    return value
  }, z.union([buildStockNumberSchema(), z.null()]).optional()) as z.ZodType<
    number | null | undefined
  >
}

const productPriceSchema = requiredNumberSchema(
  z.number().min(0, "Final price must be 0 or greater")
)
export const createProductSchema = z.object({
  name: productNameSchema,
  finalPrice: productPriceSchema,
  stock: createStockSchema(),
})

export const updateProductSchema = z
  .object({
    id: z.string().min(1, "Missing product ID"),
    name: productNameSchema.optional(),
    finalPrice: productPriceSchema.optional(),
    stock: updateStockSchema(),
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
