import type { InvoiceMetadata, Payment } from "../entities/payment"

export interface PaymentFilter {
  year?: number
  month?: number
}

export interface PaymentRepository {
  findAll(filter: PaymentFilter): Promise<Payment[]>
  findById(id: string): Promise<Payment | null>
  create(payment: Omit<Payment, "_id">): Promise<string>
  update(id: string, data: Partial<Payment>): Promise<boolean>
  delete(id: string): Promise<boolean>
  findDistinctTags(type?: string): Promise<string[]>
  appendInvoice(paymentId: string, invoice: InvoiceMetadata): Promise<boolean>
  setProviderBillLink(paymentId: string, link: string | null): Promise<boolean>
}
