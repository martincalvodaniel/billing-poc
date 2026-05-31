import type { PDFFont, PDFPage, rgb } from "pdf-lib"
import type { Client } from "./domain/entities/client"
import type { CompanyInfo } from "./domain/entities/companyInfo"
import type { Payment } from "./domain/entities/payment"
import { isSimpleSeries, paymentMethodLabelES } from "./invoicePdf-format"
import {
  BAND_HEIGHT,
  BLACK,
  COL_WIDTH,
  type GeneratedInvoiceType,
  HEADER_BG,
  LEFT_X,
  RIGHT_X,
  ROW_HEIGHT,
  SAGE_TEXT,
  WHITE,
} from "./invoicePdf-layout"

export interface Fonts {
  font: PDFFont
  bold: PDFFont
}

export function drawSageBand(
  page: PDFPage,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  label: string,
  options: {
    rightLabel?: string
    rightWidth?: number
    backgroundColor?: ReturnType<typeof rgb>
    textColor?: ReturnType<typeof rgb>
  } = {}
): void {
  const backgroundColor = options.backgroundColor ?? HEADER_BG
  const textColor = options.textColor ?? SAGE_TEXT

  page.drawRectangle({
    x,
    y: y - BAND_HEIGHT,
    width,
    height: BAND_HEIGHT,
    color: backgroundColor,
  })
  page.drawText(label, {
    x: x + 6,
    y: y - BAND_HEIGHT + 5,
    size: 9,
    font: fonts.bold,
    color: textColor,
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
      color: textColor,
    })
  }
}

export function drawRow(
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

interface CompanyAndClientArgs {
  company: CompanyInfo
  payment: Payment
  client?: Client
  series: GeneratedInvoiceType
  formattedNumber: string
  formattedDate: string
  contentTopY: number
}

/** Draws the company, invoice-number/date, payment-method and client blocks.
 *  Returns the Y at which the items table can start. */
export function drawCompanyAndClient(
  page: PDFPage,
  fonts: Fonts,
  args: CompanyAndClientArgs
): number {
  const {
    company,
    payment,
    client,
    series,
    formattedNumber,
    formattedDate,
    contentTopY,
  } = args
  let leftY = contentTopY
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
  drawRow(page, fonts, RIGHT_X + rightHalf, rightY, rightHalf, formattedDate)
  rightY -= ROW_HEIGHT + 4

  // RIGHT: MÉTODO DE PAGO (all invoice types, plain value)
  if (payment.paymentMethod) {
    drawSageBand(page, fonts, RIGHT_X, rightY, COL_WIDTH, "MÉTODO DE PAGO:")
    rightY -= BAND_HEIGHT
    drawRow(
      page,
      fonts,
      RIGHT_X,
      rightY,
      COL_WIDTH,
      paymentMethodLabelES(payment.paymentMethod)
    )
    rightY -= ROW_HEIGHT + 4
  }

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

  return Math.min(leftY, rightY)
}
