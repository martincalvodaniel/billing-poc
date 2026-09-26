import type { InvoiceCounter, NumberedInvoiceSeries } from "../entities/invoice"

export interface InvoiceCounterRepository {
  findAll(): Promise<InvoiceCounter[]>
  getNextNumber(series: NumberedInvoiceSeries, year: number): Promise<number>
  getCurrentNumber(series: NumberedInvoiceSeries, year: number): Promise<number>
  setCurrentNumber(
    series: NumberedInvoiceSeries,
    year: number,
    expectedCurrentNumber: number,
    newLastNumber: number
  ): Promise<boolean>
}
