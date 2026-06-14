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
})
