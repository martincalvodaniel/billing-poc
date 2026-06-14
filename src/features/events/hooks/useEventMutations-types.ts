"use client"

import type { PaymentMethod } from "@/lib/domain/entities/payment"

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateEventInput {
  title: string
  tag?: string
  year?: number
  month?: number
  day?: number
  dayOfWeek?: number
  hour?: number
  minute?: number
  durationMinutes?: number
  maxAttendees?: number
  pricePerSeat: number
  vatRate: number
}

export interface UpdateEventInput {
  id: string
  title?: string
  tag?: string
  year?: number
  month?: number
  day?: number
  dayOfWeek?: number
  excludedDates?: string[]
  hour?: number
  minute?: number
  durationMinutes?: number
  maxAttendees?: number
  pricePerSeat?: number
  vatRate?: number
}

export interface DeleteEventInput {
  id: string
}

export interface AddEventAttendeeInput {
  eventId: string
  clientId: string
  seats: number
}

export interface UpdateEventAttendeeInput {
  eventId: string
  clientId: string
  seats?: number
}

export interface RemoveEventAttendeeInput {
  eventId: string
  clientId: string
}

export interface GenerateEventPaymentInput {
  eventId: string
  clientId: string
  paymentMethod?: PaymentMethod
}

export interface GenerateEventPaymentsInput {
  eventId: string
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface CreateEventResponse {
  success: boolean
  id: string
}

export interface UpdateEventResponse {
  success: boolean
}

export interface DeleteEventResponse {
  success: boolean
}

export interface AddEventAttendeeResponse {
  success: boolean
}

export interface UpdateEventAttendeeResponse {
  success: boolean
}

export interface RemoveEventAttendeeResponse {
  success: boolean
}

export interface GenerateEventPaymentResponse {
  success?: boolean
  paymentId: string
  alreadyExists?: boolean
}

// ---------------------------------------------------------------------------
// Request shape
// ---------------------------------------------------------------------------

export interface BuiltRequest {
  url: string
  method: "POST" | "PUT" | "DELETE"
  body?: string
}
