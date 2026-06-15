import "server-only"

import type { PDFPage } from "pdf-lib"
import type { Payment } from "@/lib/domain/entities/payment"
import { drawSageBand, type Fonts } from "./invoicePdf-draw"
import { formatInvoiceAmount } from "./invoicePdf-format"
import {
  BAND_HEIGHT,
  BLACK,
  CONTENT_WIDTH,
  HEADER_BG,
  MARGIN,
  ROW_HEIGHT,
  SAGE_TEXT,
  TOTAL_BG,
  WHITE,
} from "./invoicePdf-layout"

/** Draws the concepts table (header + rows). Returns the Y below the table. */
export function drawItemsTable(
  page: PDFPage,
  fonts: Fonts,
  payment: Payment,
  startY: number
): number {
  const { font, bold } = fonts
  let tableY = startY
  const colConcept = MARGIN
  const colQty = MARGIN + CONTENT_WIDTH * 0.55
  const colPrice = MARGIN + CONTENT_WIDTH * 0.7
  const colTotal = MARGIN + CONTENT_WIDTH * 0.85

  page.drawRectangle({
    x: MARGIN,
    y: tableY - BAND_HEIGHT,
    width: CONTENT_WIDTH,
    height: BAND_HEIGHT,
    color: HEADER_BG,
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

  return tableY
}

/** Draws the totals block in the right column. */
export function drawTotals(
  page: PDFPage,
  fonts: Fonts,
  payment: Payment,
  startY: number
): void {
  const { font, bold } = fonts
  let totalsY = startY
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
    const isTotalRow = row.bold === true
    drawSageBand(page, fonts, totalsX, totalsY, totalsLabelWidth, row.label, {
      backgroundColor: isTotalRow ? TOTAL_BG : HEADER_BG,
      textColor: isTotalRow ? WHITE : SAGE_TEXT,
    })
    page.drawRectangle({
      x: totalsX + totalsLabelWidth,
      y: totalsY - BAND_HEIGHT,
      width: totalsWidth - totalsLabelWidth,
      height: BAND_HEIGHT,
      ...(isTotalRow
        ? { color: TOTAL_BG }
        : { borderColor: HEADER_BG, borderWidth: 0.5 }),
    })
    page.drawText(row.value, {
      x: totalsX + totalsLabelWidth + 8,
      y: totalsY - BAND_HEIGHT + 5,
      size: row.bold ? 10 : 9,
      font: row.bold ? bold : font,
      color: isTotalRow ? WHITE : BLACK,
    })
    totalsY -= BAND_HEIGHT + 2
  }
}
