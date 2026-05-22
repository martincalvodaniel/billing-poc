import type { PDFPage } from "pdf-lib"
import type { InvoicePdfFonts } from "./invoicePdf-header"
import type { Client } from "./types"

export function drawClientBlock(
  page: PDFPage,
  fonts: InvoicePdfFonts,
  yStart: number,
  client: Client | undefined
): number {
  const { font, boldFont } = fonts
  let y = yStart

  page.drawText("Bill To:", { x: 50, y, size: 14, font: boldFont })
  y -= 20

  if (client) {
    page.drawText(client.name, { x: 50, y, size: 11, font })
    y -= 15
    if (client.taxId) {
      page.drawText(`Tax ID: ${client.taxId}`, { x: 50, y, size: 11, font })
      y -= 15
    }
    if (client.address) {
      page.drawText(client.address, {
        x: 50,
        y,
        size: 11,
        font,
        maxWidth: 300,
      })
      y -= 15
    }
    if (client.email) {
      page.drawText(`Email: ${client.email}`, { x: 50, y, size: 11, font })
      y -= 15
    }
    if (client.phone) {
      page.drawText(`Phone: ${client.phone}`, { x: 50, y, size: 11, font })
      y -= 15
    }
  } else {
    page.drawText("No client associated", { x: 50, y, size: 11, font })
    y -= 15
  }

  return y - 30
}
