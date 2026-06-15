"use client"

import { describe, expect, test } from "bun:test"
import { buildPaymentTemplateRequest } from "./usePaymentTemplateMutations"

describe("buildPaymentTemplateRequest", () => {
  test("builds JSON POST requests for template creation", () => {
    const body = {
      name: "Consulting",
      formData: {
        date: "2026-06-14",
        type: "income" as const,
        concepts: [{ name: "Service", amount: 100, quantity: 1 }],
        vat: "21",
        surcharge: "",
        discount: "",
        tag: "",
        clientId: undefined,
        deliveryNoteRef: "",
        paymentMethod: "",
      },
    }
    const { url, init } = buildPaymentTemplateRequest("POST", body)

    expect(url).toBe("/api/payment-templates")
    expect(init.method).toBe("POST")
    expect(init.credentials).toBe("same-origin")
    expect(init.headers).toEqual({ "Content-Type": "application/json" })
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("builds JSON PUT requests for template updates", () => {
    const body = {
      id: "template-id",
      name: "Consulting",
      formData: {
        date: "2026-06-14",
        type: "income" as const,
        concepts: [{ name: "Service", amount: 100, quantity: 1 }],
        vat: "21",
        surcharge: "5",
        discount: "10",
        tag: "monthly",
        clientId: "client-id",
        deliveryNoteRef: "DN-1",
        paymentMethod: "card",
      },
    }
    const { url, init } = buildPaymentTemplateRequest("PUT", body)

    expect(url).toBe("/api/payment-templates")
    expect(init.method).toBe("PUT")
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("builds JSON DELETE requests for template deletion", () => {
    const body = { id: "template-id" }
    const { url, init } = buildPaymentTemplateRequest("DELETE", body)

    expect(url).toBe("/api/payment-templates")
    expect(init.method).toBe("DELETE")
    expect(init.body).toBe(JSON.stringify(body))
  })
})
