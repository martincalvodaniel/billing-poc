import type { InvoiceMetadata, Payment } from "../../domain/entities/payment"
import type { MongoPayment } from "../types"

/**
 * Pure mappers used by `MongoPaymentRepository`. Extracted to a sibling
 * module so they can be unit-tested without touching the Mongo driver.
 *
 * `migrateInvoiceMetadata` performs read-time migration of legacy invoice
 * entries onto the unified shape (`type` + optional `id`/`link` +
 * timestamps):
 *   - new `type`  ← `type`  ?? `series`
 *   - new `id`    ← `id`    ?? `formattedNumber`
 *   - legacy `series`/`number`/`formattedNumber` are read on input but
 *     never written to the output.
 *
 * `mapPaymentDocToDomain` additionally lifts legacy outcome top-level
 * fields (`providerBillLink`, `providerBillUrl` + `providerBillPathname`)
 * into the unified `invoices[]` array as link entries.
 */

type LegacyInvoiceMetadata = {
  type?: unknown
  id?: unknown
  link?: unknown
  generatedAt?: unknown
  series?: unknown
  number?: unknown
  formattedNumber?: unknown
}

type LegacyPaymentDoc = MongoPayment & {
  providerBillUrl?: unknown
  providerBillPathname?: unknown
  providerBillLink?: unknown
}

const INVOICE_TYPES = [
  "Invoice",
  "RectificativeInvoice",
  "SimpleInvoice",
  "RectificativeSimpleInvoice",
  "Receipt",
] as const

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function asDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value)
    return Number.isFinite(d.getTime()) ? d : undefined
  }
  return undefined
}

function asInvoiceType(value: unknown): InvoiceMetadata["type"] | undefined {
  if (typeof value !== "string") return undefined
  return (INVOICE_TYPES as readonly string[]).includes(value)
    ? (value as InvoiceMetadata["type"])
    : undefined
}

export function migrateInvoiceMetadata(raw: unknown): InvoiceMetadata {
  const r = (raw ?? {}) as LegacyInvoiceMetadata
  const type = asInvoiceType(r.type) ?? asInvoiceType(r.series) ?? "Invoice"
  const id = asString(r.id) ?? asString(r.formattedNumber)
  const generatedAt = asDate(r.generatedAt) ?? new Date()

  const entry: InvoiceMetadata = { type, generatedAt }
  if (id) entry.id = id
  const link = asString(r.link)
  if (link) entry.link = link
  return entry
}

function fallbackTimestamp(doc: LegacyPaymentDoc): Date {
  return asDate(doc.updatedAt) ?? asDate(doc.createdAt) ?? new Date()
}

function legacyLiftedEntry(
  generatedAt: Date,
  extras: { link?: string }
): InvoiceMetadata {
  const entry: InvoiceMetadata = {
    type: "Invoice",
    generatedAt,
  }
  if (extras.link) entry.link = extras.link
  return entry
}

function liftLegacyProviderBills(
  doc: LegacyPaymentDoc,
  invoices: InvoiceMetadata[]
): InvoiceMetadata[] {
  const out = [...invoices]
  const ts = fallbackTimestamp(doc)
  const link = asString(doc.providerBillLink)
  if (link) out.push(legacyLiftedEntry(ts, { link }))
  const providerBillUrl = asString(doc.providerBillUrl)
  if (providerBillUrl) {
    out.push(legacyLiftedEntry(ts, { link: providerBillUrl }))
  }
  return out
}

export function mapPaymentDocToDomain(doc: MongoPayment): Payment {
  const legacy = doc as LegacyPaymentDoc

  const invoice = doc.invoice ? migrateInvoiceMetadata(doc.invoice) : undefined
  const baseInvoices = Array.isArray(doc.invoices)
    ? doc.invoices.map((entry) => migrateInvoiceMetadata(entry))
    : []
  const invoices = liftLegacyProviderBills(legacy, baseInvoices)

  const out: Payment = {
    _id: doc._id?.toString(),
    type: doc.type,
    date: doc.date,
    tag: doc.tag,
    clientId: doc.clientId?.toString(),
    concepts: doc.concepts,
    vat: doc.vat,
    surcharge: doc.surcharge,
    discount: doc.discount,
    deliveryNoteRef: doc.deliveryNoteRef,
    netAmount: doc.netAmount,
    vatAmount: doc.vatAmount,
    surchargeAmount: doc.surchargeAmount,
    total: doc.total,
    paymentMethod: doc.paymentMethod,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
  if (invoice) out.invoice = invoice
  if (invoices.length > 0) out.invoices = invoices
  return out
}
