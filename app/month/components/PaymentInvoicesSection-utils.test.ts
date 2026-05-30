import { describe, expect, test } from "bun:test"
import type { InvoiceMetadata, InvoiceType } from "@/lib/types"
import { invoiceButtonState, typeLabel } from "./PaymentInvoicesSection-utils"

function invoice(type: InvoiceType): InvoiceMetadata {
  return {
    type,
    id: `${type}-1`,
    generatedAt: new Date(),
    blobUrl: "x",
    blobPathname: "x",
  }
}

describe("invoiceButtonState", () => {
  test("neither base invoice exists → both primary buttons are base", () => {
    const state = invoiceButtonState([])
    expect(state.primary).toEqual({
      label: "Invoice",
      series: "Invoice",
      rectificative: false,
    })
    expect(state.simple).toEqual({
      label: "Simple Invoice",
      series: "SimpleInvoice",
      rectificative: false,
    })
  })

  test("only base Invoice exists → primary becomes Rectificative Invoice; simple unchanged", () => {
    const state = invoiceButtonState([invoice("Invoice")])
    expect(state.primary).toEqual({
      label: "Rectificative Invoice",
      series: "RectificativeInvoice",
      rectificative: true,
    })
    expect(state.simple).toEqual({
      label: "Simple Invoice",
      series: "SimpleInvoice",
      rectificative: false,
    })
  })

  test("only base SimpleInvoice exists → simple becomes Rectificative Simple Invoice; primary unchanged", () => {
    const state = invoiceButtonState([invoice("SimpleInvoice")])
    expect(state.primary).toEqual({
      label: "Invoice",
      series: "Invoice",
      rectificative: false,
    })
    expect(state.simple).toEqual({
      label: "Rectificative Simple Invoice",
      series: "RectificativeSimpleInvoice",
      rectificative: true,
    })
  })

  test("both base + simple exist → both buttons become rectificative", () => {
    const state = invoiceButtonState([
      invoice("Invoice"),
      invoice("SimpleInvoice"),
    ])
    expect(state.primary.series).toBe("RectificativeInvoice")
    expect(state.primary.rectificative).toBe(true)
    expect(state.simple.series).toBe("RectificativeSimpleInvoice")
    expect(state.simple.rectificative).toBe(true)
  })
})

describe("typeLabel", () => {
  test("returns the human-readable label for each invoice type", () => {
    expect(typeLabel("Invoice")).toBe("Invoice")
    expect(typeLabel("SimpleInvoice")).toBe("Simple Invoice")
    expect(typeLabel("RectificativeInvoice")).toBe("Rectificative Invoice")
    expect(typeLabel("RectificativeSimpleInvoice")).toBe(
      "Rectificative Simple Invoice"
    )
    expect(typeLabel("Receipt")).toBe("Receipt")
  })
})
