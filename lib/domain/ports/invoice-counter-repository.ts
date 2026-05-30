import type { InvoiceSeries } from "../entities/payment"

export interface InvoiceCounterRepository {
  getNextNumber(series: InvoiceSeries, year: number): Promise<number>
  getCurrentNumber(series: InvoiceSeries, year: number): Promise<number>
}
