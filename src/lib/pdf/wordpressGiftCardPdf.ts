import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"
import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib"

const PAGE_WIDTH = 970
const PAGE_HEIGHT = 689
const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "pdf",
  "wordpress-gift-card-template.png"
)

const CODE_BOX = {
  x: 564,
  y: 134,
  width: 255,
  height: 81,
} as const

const EXPIRY_BOX = {
  x: 122,
  y: 106,
  width: 310,
  height: 34,
} as const

const CODE_BACKGROUND = rgb(191 / 255, 202 / 255, 161 / 255)
const CODE_TEXT = rgb(58 / 255, 67 / 255, 39 / 255)
const EXPIRY_BACKGROUND = rgb(237 / 255, 240 / 255, 224 / 255)
const EXPIRY_TEXT = rgb(152 / 255, 161 / 255, 127 / 255)

export function formatGiftCardExpiry(date: string): string {
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

function getSpacedTextWidth(
  text: string,
  font: PDFFont,
  size: number,
  spacing: number
): number {
  return (
    font.widthOfTextAtSize(text, size) + Math.max(0, text.length - 1) * spacing
  )
}

function drawSpacedText(
  page: PDFPage,
  text: string,
  options: {
    x: number
    y: number
    size: number
    spacing: number
    font: PDFFont
    color: ReturnType<typeof rgb>
  }
) {
  let x = options.x
  for (const character of text) {
    page.drawText(character, {
      x,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
    })
    x +=
      options.font.widthOfTextAtSize(character, options.size) + options.spacing
  }
}

export async function generateWordPressGiftCardPdf(input: {
  code: string
  expiryDate: string
}): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const template = await pdf.embedPng(await readFile(TEMPLATE_PATH))
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  page.drawImage(template, {
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  })

  page.drawRectangle({
    ...CODE_BOX,
    color: CODE_BACKGROUND,
  })
  const code = input.code.toLocaleUpperCase("en-US")
  const codeSize = 42
  const codeSpacing = 1.6
  const codeWidth = getSpacedTextWidth(code, font, codeSize, codeSpacing)
  drawSpacedText(page, code, {
    x: CODE_BOX.x + (CODE_BOX.width - codeWidth) / 2,
    y: 157,
    size: codeSize,
    spacing: codeSpacing,
    font,
    color: CODE_TEXT,
  })

  page.drawRectangle({
    ...EXPIRY_BOX,
    color: EXPIRY_BACKGROUND,
  })
  drawSpacedText(
    page,
    `Válido hasta el ${formatGiftCardExpiry(input.expiryDate)}`,
    {
      x: 123,
      y: 110,
      size: 23,
      spacing: 0.45,
      font,
      color: EXPIRY_TEXT,
    }
  )

  pdf.setTitle(`Tarjeta regalo ${code}`)
  pdf.setAuthor("labottegadipali.es")
  pdf.setSubject("Tarjeta regalo")

  return Buffer.from(await pdf.save())
}
