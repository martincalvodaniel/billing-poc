import { describe, expect, test } from "bun:test"
import { ObjectId } from "mongodb"
import type { Payment as MongoPayment } from "../../types"
import {
  mapPaymentDocToDomain,
  migrateInvoiceMetadata,
} from "./mongo-payment-repository-utils"

describe("migrateInvoiceMetadata", () => {
  test("populates new (type/id) from legacy (series/formattedNumber)", () => {
    const raw = {
      series: "Invoice",
      number: 3,
      formattedNumber: "F26_003",
      generatedAt: new Date("2026-02-01T10:00:00Z"),
      blobUrl: "https://blob.example/F26_003.pdf",
      blobPathname: "F26_003.pdf",
    }
    const migrated = migrateInvoiceMetadata(raw)
    expect(migrated.type).toBe("Invoice")
    expect(migrated.id).toBe("F26_003")
    expect(migrated.generatedAt).toEqual(new Date("2026-02-01T10:00:00Z"))
    expect(migrated.blobUrl).toBe("https://blob.example/F26_003.pdf")
    expect(migrated.blobPathname).toBe("F26_003.pdf")
  })

  test("does not write legacy aliases (series/number/formattedNumber) on output", () => {
    const migrated = migrateInvoiceMetadata({
      series: "Invoice",
      number: 3,
      formattedNumber: "F26_003",
      generatedAt: new Date("2026-02-01T10:00:00Z"),
    }) as unknown as Record<string, unknown>
    expect("series" in migrated).toBe(false)
    expect("number" in migrated).toBe(false)
    expect("formattedNumber" in migrated).toBe(false)
  })

  test("prefers new fields (type/id) when both are present", () => {
    const raw = {
      type: "SimpleInvoice",
      id: "S26_001",
      series: "Invoice",
      formattedNumber: "F26_999",
      number: 9,
      generatedAt: new Date("2026-03-01T00:00:00Z"),
    }
    const migrated = migrateInvoiceMetadata(raw)
    expect(migrated.type).toBe("SimpleInvoice")
    expect(migrated.id).toBe("S26_001")
  })

  test("preserves link metadata alongside canonical fields", () => {
    const raw = {
      type: "Invoice",
      id: "F26_010",
      number: 10,
      formattedNumber: "F26_010",
      series: "Invoice",
      link: "https://provider.example/x.pdf",
      generatedAt: new Date("2026-04-01T00:00:00Z"),
    }
    const migrated = migrateInvoiceMetadata(raw)
    expect(migrated.link).toBe("https://provider.example/x.pdf")
  })

  test("falls back to now() when generatedAt is missing", () => {
    const before = Date.now()
    const migrated = migrateInvoiceMetadata({ series: "Invoice" })
    const after = Date.now()
    expect(migrated.generatedAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(migrated.generatedAt.getTime()).toBeLessThanOrEqual(after)
  })

  test("defaults unknown types to Invoice", () => {
    const migrated = migrateInvoiceMetadata({
      type: "NotARealType",
      id: "x",
      generatedAt: new Date("2026-01-01"),
    })
    expect(migrated.type).toBe("Invoice")
    expect(migrated.id).toBe("x")
  })

  test("leaves id unset when no legacy or canonical id is present", () => {
    const migrated = migrateInvoiceMetadata({
      type: "Receipt",
      generatedAt: new Date("2026-04-01"),
      link: "https://x/y",
    })
    expect(migrated.id).toBeUndefined()
    expect(migrated.link).toBe("https://x/y")
  })
})

const baseDoc: MongoPayment = {
  _id: new ObjectId("507f1f77bcf86cd799439011"),
  type: "outcome",
  date: "2026-05-30",
  concepts: [{ name: "x", amount: 100, quantity: 1 }],
  vat: 21,
  netAmount: 100,
  vatAmount: 21,
  total: 121,
  createdAt: new Date("2026-05-01T00:00:00Z"),
  updatedAt: new Date("2026-05-15T12:00:00Z"),
}

describe("mapPaymentDocToDomain", () => {
  test("migrates the legacy `invoice` single field and `invoices[]` entries", () => {
    const doc: MongoPayment = {
      ...baseDoc,
      type: "income",
      invoice: {
        series: "Invoice",
        number: 1,
        formattedNumber: "F26_001",
        generatedAt: new Date("2026-01-01T00:00:00Z"),
      } as unknown as MongoPayment["invoice"],
      invoices: [
        {
          series: "SimpleInvoice",
          number: 2,
          formattedNumber: "S26_002",
          generatedAt: new Date("2026-02-01T00:00:00Z"),
        } as unknown as NonNullable<MongoPayment["invoices"]>[number],
      ],
    }
    const result = mapPaymentDocToDomain(doc)
    expect(result.invoice?.type).toBe("Invoice")
    expect(result.invoice?.id).toBe("F26_001")
    expect(result.invoices?.[0]?.type).toBe("SimpleInvoice")
    expect(result.invoices?.[0]?.id).toBe("S26_002")
  })

  test("lifts legacy providerBillLink into invoices[] as a link entry", () => {
    const doc = {
      ...baseDoc,
      providerBillLink: "https://provider.example/bill.pdf",
    } as MongoPayment
    const result = mapPaymentDocToDomain(doc)
    expect(result.invoices).toHaveLength(1)
    const entry = result.invoices?.[0]
    expect(entry?.type).toBe("Invoice")
    expect(entry?.link).toBe("https://provider.example/bill.pdf")
    expect(entry?.generatedAt).toEqual(baseDoc.updatedAt as Date)
  })

  test("lifts legacy providerBillUrl (+pathname) into invoices[] as a blob entry", () => {
    const doc = {
      ...baseDoc,
      providerBillUrl: "https://blob.example/legacy.pdf",
      providerBillPathname: "legacy.pdf",
    } as MongoPayment
    const result = mapPaymentDocToDomain(doc)
    expect(result.invoices).toHaveLength(1)
    const entry = result.invoices?.[0]
    expect(entry?.blobUrl).toBe("https://blob.example/legacy.pdf")
    expect(entry?.blobPathname).toBe("legacy.pdf")
  })

  test("lifts both legacy provider-bill flavours alongside migrated invoices[]", () => {
    const doc = {
      ...baseDoc,
      invoices: [
        {
          series: "Invoice",
          number: 1,
          formattedNumber: "F26_001",
          generatedAt: new Date("2026-01-01T00:00:00Z"),
        },
      ],
      providerBillLink: "https://provider.example/bill.pdf",
      providerBillUrl: "https://blob.example/legacy.pdf",
      providerBillPathname: "legacy.pdf",
    } as unknown as MongoPayment
    const result = mapPaymentDocToDomain(doc)
    expect(result.invoices).toHaveLength(3)
    expect(result.invoices?.[0]?.id).toBe("F26_001")
    expect(result.invoices?.[1]?.link).toBe("https://provider.example/bill.pdf")
    expect(result.invoices?.[2]?.blobUrl).toBe(
      "https://blob.example/legacy.pdf"
    )
  })

  test("does not write provider-bill top-level fields on the output", () => {
    const doc = {
      ...baseDoc,
      providerBillLink: "https://provider.example/bill.pdf",
      providerBillUrl: "https://blob.example/legacy.pdf",
    } as MongoPayment
    const result = mapPaymentDocToDomain(doc) as unknown as Record<
      string,
      unknown
    >
    expect("providerBillLink" in result).toBe(false)
    expect("providerBillUrl" in result).toBe(false)
    expect("providerBillPathname" in result).toBe(false)
  })
})
