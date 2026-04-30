import { describe, expect, test } from "bun:test"
import {
  buildGenerateInvoiceBody,
  buildUploadInvoiceFormData,
} from "./useInvoiceMutations"

describe("buildGenerateInvoiceBody", () => {
  test("returns the exact JSON body shape expected by /api/invoices/generate", () => {
    const body = buildGenerateInvoiceBody({
      paymentId: "abc123",
      series: "Invoice",
    })
    expect(body).toEqual({ paymentId: "abc123", series: "Invoice" })
  })

  test("preserves the chosen invoice series", () => {
    const body = buildGenerateInvoiceBody({
      paymentId: "p1",
      series: "RectificativeSimpleInvoice",
    })
    expect(body.series).toBe("RectificativeSimpleInvoice")
  })

  test("JSON.stringify round-trips to a stable string", () => {
    const body = buildGenerateInvoiceBody({
      paymentId: "p2",
      series: "SimpleInvoice",
    })
    expect(JSON.stringify(body)).toBe(
      '{"paymentId":"p2","series":"SimpleInvoice"}'
    )
  })
})

describe("buildUploadInvoiceFormData", () => {
  test("FormData is available in the test runtime", () => {
    expect(typeof FormData !== "undefined").toBe(true)
  })

  test("builds FormData with file and paymentId entries", () => {
    const file = new File(["pdf-bytes"], "bill.pdf", {
      type: "application/pdf",
    })
    const formData = buildUploadInvoiceFormData({
      paymentId: "payment-42",
      file,
    })

    expect(formData.get("paymentId")).toBe("payment-42")
    const uploaded = formData.get("file")
    expect(uploaded).toBeInstanceOf(File)
    expect((uploaded as File).name).toBe("bill.pdf")
    expect((uploaded as File).type).toBe("application/pdf")
  })

  test("does not include any Content-Type field (browser sets boundary)", () => {
    const file = new File(["x"], "x.pdf", { type: "application/pdf" })
    const formData = buildUploadInvoiceFormData({ paymentId: "p", file })
    expect(formData.get("Content-Type")).toBeNull()
    expect(formData.get("content-type")).toBeNull()
  })
})
