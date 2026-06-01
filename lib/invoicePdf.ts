import { PDFDocument, StandardFonts } from "pdf-lib"
import type { Client } from "./domain/entities/client"
import type { CompanyInfo } from "./domain/entities/companyInfo"
import type { Payment } from "./domain/entities/payment"
import { drawCompanyAndClient, type Fonts } from "./invoicePdf-draw"
import { drawItemsTable, drawTotals } from "./invoicePdf-draw-table"
import {
  formatInvoiceDateES,
  formatInvoiceNumber,
  invoiceTitle,
} from "./invoicePdf-format"
import {
  type GeneratedInvoiceType,
  LOGO_BOX,
  LOGO_CLEARANCE,
  MARGIN,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  SAGE_TEXT,
} from "./invoicePdf-layout"

// Re-export pure helpers so existing consumers/tests can import from here.
export {
  formatInvoiceAmount,
  formatInvoiceDateES,
  formatInvoiceNumber,
  invoiceTitle,
  parseInvoiceId,
  paymentMethodLabelES,
} from "./invoicePdf-format"

export interface InvoiceRenderContext {
  payment: Payment
  client?: Client
  series: GeneratedInvoiceType
  invoiceNumber: number
  company: CompanyInfo
}

export async function generateInvoicePdf(
  ctx: InvoiceRenderContext
): Promise<Buffer> {
  const { payment, client, series, invoiceNumber, company } = ctx
  try {
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    const font = await pdf.embedFont(StandardFonts.Courier)
    const bold = await pdf.embedFont(StandardFonts.CourierBold)
    const fonts: Fonts = { font, bold }

    const paymentDate = new Date(`${payment.date}T00:00:00Z`)
    const year = Number.isNaN(paymentDate.getTime())
      ? new Date().getUTCFullYear()
      : paymentDate.getUTCFullYear()
    const formattedNumber = formatInvoiceNumber(series, year, invoiceNumber)
    const formattedDate = formatInvoiceDateES(payment.date)

    pdf.setTitle(formattedNumber)
    pdf.setAuthor(company.name)
    pdf.setSubject("Factura")

    // Title (top-left, multi-line for rectificative variants)
    const titleLines = invoiceTitle(series)
    let titleY = PAGE_HEIGHT - MARGIN
    for (const line of titleLines) {
      page.drawText(line, {
        x: MARGIN,
        y: titleY - 22,
        size: 22,
        font: bold,
        color: SAGE_TEXT,
      })
      titleY -= 26
    }

    // Logo (top-right) — best-effort, silent skip on error
    if (company.logoUrl) {
      try {
        const res = await fetch(company.logoUrl)
        if (res.ok) {
          const bytes = new Uint8Array(await res.arrayBuffer())
          const lower = company.logoUrl.toLowerCase()
          const isJpg = lower.endsWith(".jpg") || lower.endsWith(".jpeg")
          const image = isJpg
            ? await pdf.embedJpg(bytes)
            : await pdf.embedPng(bytes)
          const scale = Math.min(
            LOGO_BOX / image.width,
            LOGO_BOX / image.height
          )
          const w = image.width * scale
          const h = image.height * scale
          page.drawImage(image, {
            x: PAGE_WIDTH - MARGIN - w,
            y: PAGE_HEIGHT - MARGIN - h,
            width: w,
            height: h,
          })
        }
      } catch (error) {
        console.error(`Failed to embed invoice logo: ${error}`)
      }
    }

    const logoBottomY = PAGE_HEIGHT - MARGIN - LOGO_BOX
    const contentTopY = Math.min(titleY - 30, logoBottomY - LOGO_CLEARANCE)

    const tableTopY = drawCompanyAndClient(page, fonts, {
      company,
      payment,
      client,
      series,
      formattedNumber,
      formattedDate,
      contentTopY,
    })

    const tableBottomY = drawItemsTable(page, fonts, payment, tableTopY - 24)
    drawTotals(page, fonts, payment, tableBottomY - 30)

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  } catch (error) {
    console.error(`Error generating PDF: ${error}`)
    throw error
  }
}
