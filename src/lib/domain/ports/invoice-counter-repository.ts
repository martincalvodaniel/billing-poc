import type { InvoiceType } from "../entities/payment"

export interface InvoiceCounterRepository {
  getNextNumber(series: InvoiceType, year: number): Promise<number>
  getCurrentNumber(series: InvoiceType, year: number): Promise<number>
}
