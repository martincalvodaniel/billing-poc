import { describe, expect, test } from "bun:test"
import type { InvoiceType } from "@/lib/domain/entities/payment"
import {
  formatInvoiceAmount,
  formatInvoiceDateES,
  formatInvoiceNumber,
  invoiceTitle,
  parseInvoiceId,
  paymentMethodLabelES,
} from "./generate"

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

describe("parseInvoiceId", () => {
  const cases: Array<[Exclude<InvoiceType, "Receipt">, number, number]> = [
    ["Invoice", 2026, 1],
    ["SimpleInvoice", 2026, 154],
    ["RectificativeInvoice", 2026, 7],
    ["RectificativeSimpleInvoice", 2027, 12],
  ]

  for (const [type, year, n] of cases) {
    test(`round-trip ${type} ${year}/${n}`, () => {
      const id = formatInvoiceNumber(type, year, n)
      const parsed = parseInvoiceId(id)
      expect(parsed).toEqual({ type, year, n })
    })
  }

  test("returns null for malformed id", () => {
    expect(parseInvoiceId("XX26_001")).toBeNull()
    expect(parseInvoiceId("F2026_001")).toBeNull()
    expect(parseInvoiceId("F26-001")).toBeNull()
    expect(parseInvoiceId("")).toBeNull()
  })

  test("returns null when sequence is zero", () => {
    expect(parseInvoiceId("F26_000")).toBeNull()
  })
})
