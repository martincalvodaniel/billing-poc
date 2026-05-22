import type { PDFPage } from "pdf-lib"
import { rgb } from "pdf-lib"
import type { InvoicePdfFonts } from "./invoicePdf-header"
import type { Payment } from "./types"

export function drawTotals(
  page: PDFPage,
  fonts: InvoicePdfFonts,
  yStart: number,
  payment: Payment
): number {
  const { font, boldFont } = fonts
  let y = yStart

  page.drawLine({
    start: { x: 350, y },
    end: { x: 540, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  })
  y -= 15

  page.drawText("Subtotal:", { x: 350, y, size: 10, font })
  page.drawText(`€${payment.netAmount.toFixed(2)}`, {
    x: 470,
    y,
    size: 10,
    font,
  })
  y -= 20

  page.drawText(`VAT (${payment.vat}%):`, { x: 350, y, size: 10, font })
  page.drawText(`€${payment.vatAmount.toFixed(2)}`, {
    x: 470,
    y,
    size: 10,
    font,
  })
  y -= 20

  if (payment.surcharge && payment.surchargeAmount) {
    page.drawText(`Surcharge (${payment.surcharge}%):`, {
      x: 350,
      y,
      size: 10,
      font,
    })
    page.drawText(`€${payment.surchargeAmount.toFixed(2)}`, {
      x: 470,
      y,
      size: 10,
      font,
    })
    y -= 20
  }

  if (payment.discount && payment.discount > 0) {
    page.drawText("Discount:", { x: 350, y, size: 10, font })
    page.drawText(`-€${payment.discount.toFixed(2)}`, {
      x: 470,
      y,
      size: 10,
      font,
    })
    y -= 20
  }

  page.drawLine({
    start: { x: 350, y },
    end: { x: 540, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  })
  y -= 15

  page.drawText("TOTAL:", { x: 350, y, size: 14, font: boldFont })
  page.drawText(`€${payment.total.toFixed(2)}`, {
    x: 470,
    y,
    size: 14,
    font: boldFont,
  })

  return y
}

export function drawFooter(
  page: PDFPage,
  fonts: InvoicePdfFonts,
  width: number
): void {
  const { font } = fonts
  const footerY = 50
  page.drawText("Thank you for your business!", {
    x: width / 2 - 80,
    y: footerY + 15,
    size: 8,
    font,
  })

  const generatedText = `Generated on ${new Date().toLocaleDateString("es-ES")} at ${new Date().toLocaleTimeString("es-ES")}`
  page.drawText(generatedText, {
    x: width / 2 - 100,
    y: footerY,
    size: 8,
    font,
  })
}
