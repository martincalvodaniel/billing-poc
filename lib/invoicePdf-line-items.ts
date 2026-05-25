import type { PDFPage } from "pdf-lib"
import { rgb } from "pdf-lib"
import type { InvoicePdfFonts } from "./invoicePdf-header"
import type { Payment } from "./types"

export function drawLineItems(
  page: PDFPage,
  fonts: InvoicePdfFonts,
  yStart: number,
  concepts: Payment["concepts"]
): number {
  const { font, boldFont } = fonts
  let y = yStart

  page.drawText("Description", { x: 50, y, size: 10, font: boldFont })
  page.drawText("Quantity", { x: 280, y, size: 10, font: boldFont })
  page.drawText("Unit Price", { x: 360, y, size: 10, font: boldFont })
  page.drawText("Amount", { x: 470, y, size: 10, font: boldFont })
  y -= 5

  page.drawLine({
    start: { x: 50, y },
    end: { x: 540, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  })
  y -= 15

  concepts.forEach((concept) => {
    const lineTotal = concept.amount * concept.quantity
    page.drawText(concept.name.substring(0, 30), { x: 50, y, size: 10, font })
    page.drawText(concept.quantity.toString(), { x: 290, y, size: 10, font })
    page.drawText(`€${concept.amount.toFixed(2)}`, {
      x: 360,
      y,
      size: 10,
      font,
    })
    page.drawText(`€${lineTotal.toFixed(2)}`, { x: 470, y, size: 10, font })
    y -= 20
  })

  return y - 10
}
