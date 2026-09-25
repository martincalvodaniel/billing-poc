import type { InvoiceCounter } from "../entities/invoice"
import type { InvoiceType } from "../entities/payment"

export interface InvoiceCounterRepository {
  findAll(): Promise<InvoiceCounter[]>
  getNextNumber(series: InvoiceType, year: number): Promise<number>
  getCurrentNumber(series: InvoiceType, year: number): Promise<number>
}
