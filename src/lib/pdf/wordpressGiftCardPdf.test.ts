import { beforeAll, describe, expect, mock, test } from "bun:test"
import { PDFDocument } from "pdf-lib"

mock.module("server-only", () => ({}))

type GiftCardModule = typeof import("./wordpressGiftCardPdf")

let formatGiftCardExpiry: GiftCardModule["formatGiftCardExpiry"]
let generateWordPressGiftCardPdf: GiftCardModule["generateWordPressGiftCardPdf"]

beforeAll(async () => {
  ;({ formatGiftCardExpiry, generateWordPressGiftCardPdf } = await import(
    "./wordpressGiftCardPdf"
  ))
})

describe("formatGiftCardExpiry", () => {
  test("formats the expiry date in the gift-card Spanish format", () => {
    expect(formatGiftCardExpiry("2027-06-19")).toBe("19/06/2027")
  })
})

describe("generateWordPressGiftCardPdf", () => {
  test("generates a single landscape gift-card page", async () => {
    const bytes = await generateWordPressGiftCardPdf({
      code: "qcxa8nny",
      expiryDate: "2027-06-19",
    })
    const pdf = await PDFDocument.load(bytes)
    const [page] = pdf.getPages()

    expect(pdf.getPageCount()).toBe(1)
    expect(page.getWidth()).toBe(970)
    expect(page.getHeight()).toBe(689)
  })
})
