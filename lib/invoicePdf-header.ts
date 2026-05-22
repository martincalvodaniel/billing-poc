import type { PDFFont, PDFPage } from "pdf-lib"
import { rgb } from "pdf-lib"
import type { InvoiceSeries, Payment } from "./types"

export interface InvoicePdfFonts {
  font: PDFFont
  boldFont: PDFFont
}

export function drawCompanyHeader(
  page: PDFPage,
  fonts: InvoicePdfFonts,
  yStart: number
): number {
  const { font, boldFont } = fonts
  let y = yStart

  page.drawText("YOUR COMPANY NAME", {
    x: 50,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  y -= 25

  page.drawText("Tax ID: YOUR-TAX-ID", { x: 50, y, size: 10, font })
  y -= 15
  page.drawText("Address Line 1", { x: 50, y, size: 10, font })
  y -= 15
  page.drawText("City, Postal Code", { x: 50, y, size: 10, font })
  y -= 15
  page.drawText("Email: info@yourcompany.com", { x: 50, y, size: 10, font })
  y -= 15
  page.drawText("Phone: +XX XXX XXX XXX", { x: 50, y, size: 10, font })
  y -= 40

  return y
}

export function drawInvoiceMeta(
  page: PDFPage,
  fonts: InvoicePdfFonts,
  yStart: number,
  series: InvoiceSeries,
  invoiceNumber: number,
  payment: Payment
): number {
  const { font, boldFont } = fonts
  let y = yStart

  page.drawText(series.toUpperCase(), {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  y -= 30

  page.drawText(
    `Invoice Number: ${series}-${String(invoiceNumber).padStart(6, "0")}`,
    { x: 50, y, size: 12, font }
  )
  y -= 15

  page.drawText(`Date: ${new Date(payment.date).toLocaleDateString("es-ES")}`, {
    x: 50,
    y,
    size: 12,
    font,
  })
  y -= 15

  if (payment.deliveryNoteRef) {
    page.drawText(`Delivery Note Ref: ${payment.deliveryNoteRef}`, {
      x: 50,
      y,
      size: 12,
      font,
    })
    y -= 15
  }

  return y - 30
}
