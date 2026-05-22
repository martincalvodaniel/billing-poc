import type { ObjectId } from "mongodb"
import type { PartOfDay } from "./domain/entities/absence"

export type { PartOfDay }

export type PaymentType = "income" | "outcome"

export type ClientType = "individual" | "company"

export type InvoiceSeries =
  | "Invoice"
  | "RectificativeInvoice"
  | "SimpleInvoice"
  | "RectificativeSimpleInvoice"

export interface InvoiceMetadata {
  series: InvoiceSeries
  number: number // Sequential number within the series
  generatedAt: Date
  blobUrl: string // Vercel Blob URL
  blobPathname: string // Storage path for retrieval
}

export interface PaymentConcept {
  name: string
  amount: number
  quantity: number
}

export interface Payment {
  _id?: ObjectId
  type: PaymentType
  date: string
  tag?: string
  clientId?: ObjectId
  concepts: PaymentConcept[]
  vat: number
  surcharge?: number
  deliveryNoteRef?: string
  netAmount: number
  vatAmount: number
  surchargeAmount?: number
  total: number
  invoice?: InvoiceMetadata // Generated invoice (for income payments)
  providerBillUrl?: string // Uploaded provider bill URL (for outcome payments)
  providerBillPathname?: string // Uploaded provider bill storage path
  createdAt: Date
  updatedAt: Date
}

export interface PaymentFormData {
  type: PaymentType
  date: string
  concepts: PaymentConcept[]
  vat: string
  surcharge?: string
  tag?: string
  clientId?: string
  deliveryNoteRef?: string
}

export interface Client {
  _id?: ObjectId
  clientType: ClientType
  name: string
  taxId: string
  address: string
  phone?: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

export interface ClientFormData {
  clientType: ClientType
  name: string
  taxId: string
  address: string
  phone?: string
  email?: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

export interface InvoiceCounter {
  _id?: ObjectId
  series: InvoiceSeries
  lastNumber: number
  updatedAt: Date
}

export type AbsenceType = "absence" | "recovery"

export interface Absence {
  _id?: ObjectId
  type: AbsenceType
  studentName: string
  studentNameLower: string
  date: string
  partOfDay: PartOfDay
  comment?: string
  createdAt: Date
  updatedAt: Date
}

export interface AbsenceFormData {
  type: AbsenceType
  studentName: string
  date: string
  partOfDay: PartOfDay
  comment?: string
}

export interface EventAttendee {
  clientId: ObjectId
  seats: number
  paymentId?: ObjectId
  addedAt: Date
}

export interface Event {
  _id?: ObjectId
  title: string
  description?: string
  year?: number
  month?: number
  day?: number
  hour?: number
  minute?: number
  date?: string
  durationMinutes?: number
  maxAttendees?: number
  pricePerSeat: number
  vatRate: number
  attendees: EventAttendee[]
  createdAt: Date
  updatedAt: Date
}

export interface EventFormData {
  title: string
  description?: string
  year?: string
  month?: string
  day?: string
  hour?: string
  minute?: string
  durationMinutes?: string
  maxAttendees?: string
  pricePerSeat: string
  vatRate: string
}
