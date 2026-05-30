import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib"
import type { Client } from "./domain/entities/client"
import type { CompanyInfo } from "./domain/entities/companyInfo"
import type {
  InvoiceSeries,
  Payment,
  PaymentMethod,
} from "./domain/entities/payment"

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 50
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const COL_GAP = 16
const COL_WIDTH = (CONTENT_WIDTH - COL_GAP) / 2
const LEFT_X = MARGIN
const RIGHT_X = MARGIN + COL_WIDTH + COL_GAP
const BAND_HEIGHT = 18
const ROW_HEIGHT = 14
const LOGO_BOX = 70

const SAGE_GREEN = rgb(0xa9 / 255, 0xb7 / 255, 0x86 / 255)
const SAGE_TEXT = rgb(0x6b / 255, 0x7a / 255, 0x4e / 255)
const BLACK = rgb(0, 0, 0)
const WHITE = rgb(1, 1, 1)

// ---------- Pure helpers (exported for tests) ----------

const SERIES_PREFIX: Record<InvoiceSeries, string> = {
  Invoice: "F",
  SimpleInvoice: "FS",
  RectificativeInvoice: "FR",
  RectificativeSimpleInvoice: "FSR",
}

export function formatInvoiceNumber(
  series: InvoiceSeries,
  year: number,
  n: number
): string {
  const yy = String(year % 100).padStart(2, "0")
  const nnn = String(n).padStart(3, "0")
  return `${SERIES_PREFIX[series]}${yy}_${nnn}`
}

export function formatInvoiceDateES(date: string | Date): string {
  let d: Date
  if (typeof date === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
    if (match) {
      d = new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      )
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d)
}

const PAYMENT_METHOD_LABEL_ES: Record<PaymentMethod, string> = {
  cash: "Pago en efectivo",
  card: "Pago con tarjeta bancaria",
  bank_transfer: "Pago por transferencia",
}

export function paymentMethodLabelES(
  method: PaymentMethod | undefined
): string {
  if (!method) return ""
  return PAYMENT_METHOD_LABEL_ES[method] ?? ""
}

export function formatInvoiceAmount(n: number): string {
  return `${n.toFixed(2).replace(".", ",")}€`
}

export function invoiceTitle(series: InvoiceSeries): string[] {
  switch (series) {
    case "Invoice":
      return ["FACTURA"]
    case "SimpleInvoice":
      return ["FACTURA SIMPLIFICADA"]
    case "RectificativeInvoice":
      return ["FACTURA", "RECTIFICATIVA"]
    case "RectificativeSimpleInvoice":
      return ["FACTURA SIMPLIFICADA", "RECTIFICATIVA"]
  }
}

function isSimpleSeries(series: InvoiceSeries): boolean {
  return series === "SimpleInvoice" || series === "RectificativeSimpleInvoice"
}

// ---------- Drawing helpers ----------

interface Fonts {
  font: PDFFont
  bold: PDFFont
}

function drawSageBand(
  page: PDFPage,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  label: string,
  options: { rightLabel?: string; rightWidth?: number } = {}
): void {
  page.drawRectangle({
    x,
    y: y - BAND_HEIGHT,
    width,
    height: BAND_HEIGHT,
    color: SAGE_GREEN,
  })
  page.drawText(label, {
    x: x + 6,
    y: y - BAND_HEIGHT + 5,
    size: 9,
    font: fonts.bold,
    color: SAGE_TEXT,
  })
  if (options.rightLabel && options.rightWidth) {
    const split = x + width - options.rightWidth
    page.drawLine({
      start: { x: split, y: y - BAND_HEIGHT },
      end: { x: split, y },
      thickness: 1,
      color: WHITE,
    })
    page.drawText(options.rightLabel, {
      x: split + 6,
      y: y - BAND_HEIGHT + 5,
      size: 9,
      font: fonts.bold,
      color: SAGE_TEXT,
    })
  }
}

function drawRow(
  page: PDFPage,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  text: string
): void {
  page.drawText(text, {
    x: x + 6,
    y: y - ROW_HEIGHT + 4,
    size: 9,
    font: fonts.font,
    color: BLACK,
    maxWidth: width - 12,
  })
}

function drawPill(
  page: PDFPage,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  text: string
): void {
  const h = ROW_HEIGHT - 2
  page.drawRectangle({
    x,
    y: y - h,
    width,
    height: h,
    color: SAGE_GREEN,
  })
  page.drawText(text, {
    x: x + 8,
    y: y - h + 4,
    size: 9,
    font: fonts.bold,
    color: WHITE,
  })
}

// ---------- Main renderer ----------

export interface InvoiceRenderContext {
  payment: Payment
  client?: Client
  series: InvoiceSeries
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

    let leftY = titleY - 30
    let rightY = leftY

    // LEFT: DATOS DE EMPRESA
    drawSageBand(page, fonts, LEFT_X, leftY, COL_WIDTH, "DATOS DE EMPRESA:")
    leftY -= BAND_HEIGHT
    const companyRows = [
      company.name,
      company.taxId,
      company.addressLine,
      `${company.postalCode} ${company.city} (${company.country})`,
      company.phone,
      company.email,
    ]
    for (const text of companyRows) {
      drawRow(page, fonts, LEFT_X, leftY, COL_WIDTH, text)
      leftY -= ROW_HEIGHT
    }

    // RIGHT: Nº FACTURA + FECHA split band
    const rightHalf = COL_WIDTH / 2
    drawSageBand(page, fonts, RIGHT_X, rightY, COL_WIDTH, "Nº FACTURA:", {
      rightLabel: "FECHA:",
      rightWidth: rightHalf,
    })
    rightY -= BAND_HEIGHT
    drawRow(page, fonts, RIGHT_X, rightY, rightHalf, formattedNumber)
    drawPill(
      page,
      fonts,
      RIGHT_X + rightHalf + 6,
      rightY - 1,
      rightHalf - 12,
      formattedDate
    )
    rightY -= ROW_HEIGHT + 4

    // RIGHT: DATOS CLIENTE
    drawSageBand(page, fonts, RIGHT_X, rightY, COL_WIDTH, "DATOS CLIENTE:")
    rightY -= BAND_HEIGHT
    if (isSimpleSeries(series)) {
      drawRow(page, fonts, RIGHT_X, rightY, COL_WIDTH, "Particular")
      rightY -= ROW_HEIGHT
    } else if (client) {
      const clientRows = [
        client.name,
        client.taxId ?? "",
        client.address ?? "",
        client.email ?? "",
        client.phone ?? "",
      ].filter((s) => s.length > 0)
      for (const text of clientRows) {
        drawRow(page, fonts, RIGHT_X, rightY, COL_WIDTH, text)
        rightY -= ROW_HEIGHT
      }
    }

    // RIGHT (simple only): MÉTODO DE PAGO band
    if (isSimpleSeries(series) && payment.paymentMethod) {
      rightY -= 6
      drawSageBand(page, fonts, RIGHT_X, rightY, COL_WIDTH, "MÉTODO DE PAGO:")
      rightY -= BAND_HEIGHT
      drawPill(
        page,
        fonts,
        RIGHT_X + 6,
        rightY - 1,
        COL_WIDTH - 12,
        paymentMethodLabelES(payment.paymentMethod)
      )
      rightY -= ROW_HEIGHT + 4
    }

    // Items table
    let tableY = Math.min(leftY, rightY) - 24
    const colConcept = MARGIN
    const colQty = MARGIN + CONTENT_WIDTH * 0.55
    const colPrice = MARGIN + CONTENT_WIDTH * 0.7
    const colTotal = MARGIN + CONTENT_WIDTH * 0.85

    page.drawRectangle({
      x: MARGIN,
      y: tableY - BAND_HEIGHT,
      width: CONTENT_WIDTH,
      height: BAND_HEIGHT,
      color: SAGE_GREEN,
    })
    const headerY = tableY - BAND_HEIGHT + 5
    page.drawText("Concepto", {
      x: colConcept + 6,
      y: headerY,
      size: 9,
      font: bold,
      color: SAGE_TEXT,
    })
    page.drawText("Cantidad", {
      x: colQty + 6,
      y: headerY,
      size: 9,
      font: bold,
      color: SAGE_TEXT,
    })
    page.drawText("Precio/und", {
      x: colPrice + 6,
      y: headerY,
      size: 9,
      font: bold,
      color: SAGE_TEXT,
    })
    page.drawText("Total", {
      x: colTotal + 6,
      y: headerY,
      size: 9,
      font: bold,
      color: SAGE_TEXT,
    })
    tableY -= BAND_HEIGHT

    for (const concept of payment.concepts) {
      const qty = concept.quantity ?? 1
      const lineTotal = concept.amount * qty
      const rowY = tableY - ROW_HEIGHT + 4
      page.drawText(concept.name, {
        x: colConcept + 6,
        y: rowY,
        size: 9,
        font,
        color: BLACK,
        maxWidth: colQty - colConcept - 12,
      })
      page.drawText(String(qty), {
        x: colQty + 6,
        y: rowY,
        size: 9,
        font,
        color: BLACK,
      })
      page.drawText(formatInvoiceAmount(concept.amount), {
        x: colPrice + 6,
        y: rowY,
        size: 9,
        font,
        color: BLACK,
      })
      page.drawText(formatInvoiceAmount(lineTotal), {
        x: colTotal + 6,
        y: rowY,
        size: 9,
        font,
        color: BLACK,
      })
      tableY -= ROW_HEIGHT
    }

    // Totals (right column)
    let totalsY = tableY - 30
    const totalsWidth = CONTENT_WIDTH * 0.45
    const totalsX = MARGIN + CONTENT_WIDTH - totalsWidth
    const totalsLabelWidth = totalsWidth * 0.55

    const totalRows: { label: string; value: string; bold?: boolean }[] = [
      { label: "SUBTOTAL:", value: formatInvoiceAmount(payment.netAmount) },
      {
        label: `IVA (${payment.vat}%):`,
        value: formatInvoiceAmount(payment.vatAmount),
      },
    ]
    if (payment.surcharge && payment.surchargeAmount) {
      totalRows.push({
        label: "RECARGO:",
        value: formatInvoiceAmount(payment.surchargeAmount),
      })
    }
    if (payment.discount && payment.discount > 0) {
      totalRows.push({
        label: "DESCUENTO:",
        value: `-${formatInvoiceAmount(payment.discount)}`,
      })
    }
    totalRows.push({
      label: "TOTAL:",
      value: formatInvoiceAmount(payment.total),
      bold: true,
    })

    for (const row of totalRows) {
      drawSageBand(page, fonts, totalsX, totalsY, totalsLabelWidth, row.label)
      page.drawRectangle({
        x: totalsX + totalsLabelWidth,
        y: totalsY - BAND_HEIGHT,
        width: totalsWidth - totalsLabelWidth,
        height: BAND_HEIGHT,
        borderColor: SAGE_GREEN,
        borderWidth: 0.5,
      })
      page.drawText(row.value, {
        x: totalsX + totalsLabelWidth + 8,
        y: totalsY - BAND_HEIGHT + 5,
        size: row.bold ? 10 : 9,
        font: row.bold ? bold : font,
        color: BLACK,
      })
      totalsY -= BAND_HEIGHT + 2
    }

    // Footer (regular invoices only)
    if (!isSimpleSeries(series)) {
      const footerText = paymentMethodLabelES(payment.paymentMethod)
      if (footerText) {
        page.drawText(footerText, {
          x: MARGIN,
          y: MARGIN,
          size: 10,
          font: bold,
          color: SAGE_TEXT,
        })
      }
    }

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  } catch (error) {
    console.error(`Error generating PDF: ${error}`)
    throw error
  }
}
