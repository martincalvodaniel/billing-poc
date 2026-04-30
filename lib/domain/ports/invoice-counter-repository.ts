import type { InvoiceSeries } from "../entities/payment"

export interface InvoiceCounterRepository {
  getNextNumber(series: InvoiceSeries): Promise<number>
  getCurrentNumber(series: InvoiceSeries): Promise<number>
}
