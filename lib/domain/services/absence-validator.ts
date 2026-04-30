import { z } from "zod"

const absenceBaseSchema = z.object({
  type: z.enum(["absence", "recovery"]),
  studentName: z
    .string()
    .trim()
    .min(1, "Student name is required")
    .max(80, "Student name must be 80 characters or fewer"),
  date: z.string().min(1, "Date is required"),
  comment: z
    .string()
    .trim()
    .max(500, "Comment must be 500 characters or fewer")
    .optional(),
})

export const createAbsenceSchema = absenceBaseSchema

export const updateAbsenceSchema = z
  .object({
    id: z.string().min(1, "Missing absence ID"),
    type: z.enum(["absence", "recovery"]).optional(),
    studentName: z
      .string()
      .trim()
      .min(1, "Student name cannot be empty")
      .max(80, "Student name must be 80 characters or fewer")
      .optional(),
    date: z.string().min(1, "Date cannot be empty").optional(),
    comment: z
      .string()
      .trim()
      .max(500, "Comment must be 500 characters or fewer")
      .optional(),
  })
  .refine(
    (data) => {
      const { id: _id, ...rest } = data
      return Object.values(rest).some((v) => v !== undefined)
    },
    { message: "No fields to update" }
  )

export const deleteAbsenceSchema = z.object({
  id: z.string().min(1, "Missing absence ID"),
})

export const absenceQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce
    .number()
    .int()
    .min(1, "Invalid month")
    .max(12, "Invalid month")
    .optional(),
})

export const absenceStudentsQuerySchema = z.object({
  q: z.string().trim().optional(),
})

export type CreateAbsenceInput = z.infer<typeof createAbsenceSchema>
export type UpdateAbsenceInput = z.infer<typeof updateAbsenceSchema>
export type DeleteAbsenceInput = z.infer<typeof deleteAbsenceSchema>
export type AbsenceQueryInput = z.infer<typeof absenceQuerySchema>
export type AbsenceStudentsQueryInput = z.infer<
  typeof absenceStudentsQuerySchema
>
