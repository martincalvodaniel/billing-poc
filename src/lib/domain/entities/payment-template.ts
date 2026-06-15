import type { PaymentConcept, PaymentMethod, PaymentType } from "./payment"

export interface PaymentTemplate {
  _id?: string
  name: string
  type: PaymentType
  concepts: PaymentConcept[]
  vat: number
  surcharge?: number
  discount?: number
  tag?: string
  clientId?: string
  deliveryNoteRef?: string
  paymentMethod?: PaymentMethod
  createdAt: Date
  updatedAt: Date
}
