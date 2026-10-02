import type { InvoiceMetadata, NewPayment, Payment } from "../entities/payment"

export interface PaymentFilter {
  year?: number
  month?: number
}

export interface PaymentRepository {
  findAll(filter: PaymentFilter): Promise<Payment[]>
  findAllWithGeneratedInvoices(): Promise<Payment[]>
  findById(id: string): Promise<Payment | null>
  create(payment: NewPayment): Promise<string>
  update(id: string, data: Partial<Payment>): Promise<boolean>
  delete(id: string): Promise<boolean>
  findDistinctTags(type?: string): Promise<string[]>
  appendInvoice(paymentId: string, invoice: InvoiceMetadata): Promise<boolean>
  removeLinkInvoice(paymentId: string, link: string): Promise<boolean>
  removeGeneratedInvoices(invoiceIds: string[]): Promise<number>
}
