import { z } from "zod"
import { deriveEventDate } from "./event-pricing"

const baseFields = {
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional(),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Invalid year")
    .max(2999, "Invalid year")
    .optional(),
  month: z.coerce
    .number()
    .int()
    .min(1, "Invalid month")
    .max(12, "Invalid month")
    .optional(),
  day: z.coerce
    .number()
    .int()
    .min(1, "Invalid day")
    .max(31, "Invalid day")
    .optional(),
  hour: z.coerce
    .number()
    .int()
    .min(0, "Invalid hour")
    .max(23, "Invalid hour")
    .optional(),
  minute: z.coerce
    .number()
    .int()
    .min(0, "Invalid minute")
    .max(59, "Invalid minute")
    .optional(),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .optional(),
  maxAttendees: z.coerce
    .number()
    .int()
    .min(1, "Max attendees must be at least 1")
    .optional(),
  pricePerSeat: z.coerce
    .number({ message: "Invalid price per seat" })
    .min(0, "Price per seat must be non-negative"),
  vatRate: z.coerce
    .number({ message: "Invalid VAT rate" })
    .min(0, "VAT rate must be 0 or more")
    .max(100, "VAT rate must be 100 or less"),
}

function applyDateRefinements<T extends z.ZodTypeAny>(schema: T): T {
  return schema
    .refine(
      (data: unknown) => {
        const d = data as { year?: number; month?: number }
        return d.month === undefined || d.year !== undefined
      },
      { message: "Month requires year", path: ["month"] }
    )
    .refine(
      (data: unknown) => {
        const d = data as { year?: number; month?: number; day?: number }
        return (
          d.day === undefined || (d.year !== undefined && d.month !== undefined)
        )
      },
      { message: "Day requires year and month", path: ["day"] }
    )
    .refine(
      (data: unknown) => {
        const d = data as { year?: number; month?: number; day?: number }
        if (
          d.year === undefined ||
          d.month === undefined ||
          d.day === undefined
        ) {
          return true
        }
        return deriveEventDate(d.year, d.month, d.day) !== undefined
      },
      { message: "Invalid Gregorian date", path: ["day"] }
    ) as unknown as T
}

export const createEventSchema = applyDateRefinements(z.object(baseFields))

export const updateEventSchema = applyDateRefinements(
  z
    .object({
      id: z.string().min(1, "Missing event ID"),
      title: z
        .string()
        .trim()
        .min(1, "Title cannot be empty")
        .max(200, "Title must be 200 characters or fewer")
        .optional(),
      description: z
        .string()
        .trim()
        .max(2000, "Description must be 2000 characters or fewer")
        .optional(),
      year: baseFields.year,
      month: baseFields.month,
      day: baseFields.day,
      hour: baseFields.hour,
      minute: baseFields.minute,
      durationMinutes: baseFields.durationMinutes,
      maxAttendees: baseFields.maxAttendees,
      pricePerSeat: z.coerce
        .number({ message: "Invalid price per seat" })
        .min(0, "Price per seat must be non-negative")
        .optional(),
      vatRate: z.coerce
        .number({ message: "Invalid VAT rate" })
        .min(0, "VAT rate must be 0 or more")
        .max(100, "VAT rate must be 100 or less")
        .optional(),
    })
    .refine(
      (data) => {
        const { id: _id, ...rest } = data
        return Object.values(rest).some((v) => v !== undefined)
      },
      { message: "No fields to update" }
    )
)

export const deleteEventSchema = z.object({
  id: z.string().min(1, "Missing event ID"),
})

export const eventQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce
    .number()
    .int()
    .min(1, "Invalid month")
    .max(12, "Invalid month")
    .optional(),
})

export const addAttendeeSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  seats: z.coerce.number().int().min(1, "Seats must be at least 1"),
})

export const updateAttendeeSchema = z
  .object({
    seats: z.coerce
      .number()
      .int()
      .min(1, "Seats must be at least 1")
      .optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "No fields to update",
  })

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type DeleteEventInput = z.infer<typeof deleteEventSchema>
export type EventQueryInput = z.infer<typeof eventQuerySchema>
export type AddAttendeeInput = z.infer<typeof addAttendeeSchema>
export type UpdateAttendeeInput = z.infer<typeof updateAttendeeSchema>
