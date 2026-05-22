import { PDFDocument, StandardFonts } from "pdf-lib"
import { drawClientBlock } from "./invoicePdf-client"
import { drawCompanyHeader, drawInvoiceMeta } from "./invoicePdf-header"
import { drawLineItems } from "./invoicePdf-line-items"
import { drawFooter, drawTotals } from "./invoicePdf-totals"
import type { Client, InvoiceSeries, Payment } from "./types"

interface InvoiceData {
  payment: Payment
  client?: Client
  invoiceNumber: number
  series: InvoiceSeries
}

/**
 * Generate a PDF invoice from payment data using pdf-lib (serverless-compatible)
 * Returns a Buffer containing the PDF
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const { payment, client, invoiceNumber, series } = data

  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size in points
    const { width, height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fonts = { font, boldFont }

    pdfDoc.setTitle(`${series} ${invoiceNumber}`)
    pdfDoc.setAuthor("Billing POC")
    pdfDoc.setSubject(`Invoice for payment`)

    let yPos = height - 50
    yPos = drawCompanyHeader(page, fonts, yPos)
    yPos = drawInvoiceMeta(page, fonts, yPos, series, invoiceNumber, payment)
    yPos = drawClientBlock(page, fonts, yPos, client)
    yPos = drawLineItems(page, fonts, yPos, payment.concepts)
    drawTotals(page, fonts, yPos, payment)
    drawFooter(page, fonts, width)

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}
