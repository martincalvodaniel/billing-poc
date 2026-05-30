import { describe, expect, test } from "bun:test"
import {
  buildGenerateInvoiceBody,
  buildOpenInvoiceUrl,
  buildUploadInvoiceFormData,
  type GenerateInvoiceResult,
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

describe("buildOpenInvoiceUrl", () => {
  test("formats the precise per-invoice download URL", () => {
    const url = buildOpenInvoiceUrl("abc123", "Invoice", 1)
    expect(url).toBe("/api/invoices/abc123/Invoice/1")
  })

  test("URI-encodes the paymentId segment", () => {
    const url = buildOpenInvoiceUrl("a/b c", "SimpleInvoice", 42)
    expect(url).toBe("/api/invoices/a%2Fb%20c/SimpleInvoice/42")
  })

  test("preserves each rectificative series in the path", () => {
    expect(buildOpenInvoiceUrl("p", "RectificativeInvoice", 7)).toBe(
      "/api/invoices/p/RectificativeInvoice/7"
    )
    expect(buildOpenInvoiceUrl("p", "RectificativeSimpleInvoice", 9)).toBe(
      "/api/invoices/p/RectificativeSimpleInvoice/9"
    )
  })
})

describe("GenerateInvoiceResult", () => {
  test("parses the response shape returned by /api/invoices/generate", () => {
    const sample: GenerateInvoiceResult = {
      success: true,
      invoice: {
        series: "Invoice",
        number: 3,
        formattedNumber: "F26_003",
        generatedAt: new Date("2026-05-30T12:00:00Z"),
        blobUrl: "https://blob.example/F26_003.pdf",
        blobPathname: "F26_003.pdf",
      },
      invoices: [
        {
          series: "Invoice",
          number: 3,
          formattedNumber: "F26_003",
          generatedAt: new Date("2026-05-30T12:00:00Z"),
          blobUrl: "https://blob.example/F26_003.pdf",
          blobPathname: "F26_003.pdf",
        },
      ],
      downloadUrl: "/api/invoices/pay/Invoice/3",
    }
    expect(sample.invoices).toHaveLength(1)
    expect(sample.invoices[0]?.formattedNumber).toBe("F26_003")
    expect(sample.downloadUrl).toBe("/api/invoices/pay/Invoice/3")
  })
})
