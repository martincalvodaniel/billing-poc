import { describe, expect, test } from "bun:test"
import {
  formatInvoiceAmount,
  formatInvoiceDateES,
  formatInvoiceNumber,
  invoiceTitle,
  paymentMethodLabelES,
} from "./invoicePdf"

describe("formatInvoiceNumber", () => {
  test("Invoice prefix F", () => {
    expect(formatInvoiceNumber("Invoice", 2026, 2)).toBe("F26_002")
  })
  test("SimpleInvoice prefix FS", () => {
    expect(formatInvoiceNumber("SimpleInvoice", 2026, 154)).toBe("FS26_154")
  })
  test("RectificativeInvoice prefix FR", () => {
    expect(formatInvoiceNumber("RectificativeInvoice", 2026, 1)).toBe(
      "FR26_001"
    )
  })
  test("RectificativeSimpleInvoice prefix FSR", () => {
    expect(formatInvoiceNumber("RectificativeSimpleInvoice", 2027, 12)).toBe(
      "FSR27_012"
    )
  })
})

describe("formatInvoiceDateES", () => {
  test("April 21st", () => {
    expect(formatInvoiceDateES("2026-04-21")).toBe("21/4/2026")
  })
  test("January 1st", () => {
    expect(formatInvoiceDateES("2026-01-01")).toBe("1/1/2026")
  })
})

describe("paymentMethodLabelES", () => {
  test("cash", () => {
    expect(paymentMethodLabelES("cash")).toBe("Pago en efectivo")
  })
  test("card", () => {
    expect(paymentMethodLabelES("card")).toBe("Pago con tarjeta bancaria")
  })
  test("bank_transfer", () => {
    expect(paymentMethodLabelES("bank_transfer")).toBe("Pago por transferencia")
  })
  test("undefined", () => {
    expect(paymentMethodLabelES(undefined)).toBe("")
  })
})

describe("formatInvoiceAmount", () => {
  test("integer", () => {
    expect(formatInvoiceAmount(300)).toBe("300,00€")
  })
  test("decimal", () => {
    expect(formatInvoiceAmount(247.93)).toBe("247,93€")
  })
  test("zero", () => {
    expect(formatInvoiceAmount(0)).toBe("0,00€")
  })
})

describe("invoiceTitle", () => {
  test("Invoice", () => {
    expect(invoiceTitle("Invoice")).toEqual(["FACTURA"])
  })
  test("SimpleInvoice", () => {
    expect(invoiceTitle("SimpleInvoice")).toEqual(["FACTURA SIMPLIFICADA"])
  })
  test("RectificativeInvoice", () => {
    expect(invoiceTitle("RectificativeInvoice")).toEqual([
      "FACTURA",
      "RECTIFICATIVA",
    ])
  })
  test("RectificativeSimpleInvoice", () => {
    expect(invoiceTitle("RectificativeSimpleInvoice")).toEqual([
      "FACTURA SIMPLIFICADA",
      "RECTIFICATIVA",
    ])
  })
})
