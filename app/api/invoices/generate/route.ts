import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { MongoClientRepository } from "@/lib/adapters/repositories/mongo-client-repository"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"
import { requireAuth } from "@/lib/api-auth"
import type { Client } from "@/lib/domain/entities/client"
import {
  getPaymentInvoices,
  type InvoiceMetadata,
} from "@/lib/domain/entities/payment"
import {
  assertCanGenerateInvoice,
  generateInvoiceSchema,
  REGULAR_INVOICE_TYPES,
} from "@/lib/domain/services/invoice-validator"
import { getNextInvoiceNumber } from "@/lib/invoiceCounters"
import { formatInvoiceNumber, generateInvoicePdf } from "@/lib/invoicePdf"
import { getCompanyInfo } from "@/lib/server-cache"
import { zodError } from "@/lib/validation"

const paymentRepo = new MongoPaymentRepository()
const clientRepo = new MongoClientRepository()

function paymentYearFromDate(date: string): number {
  const head = date.slice(0, 4)
  const parsed = Number.parseInt(head, 10)
  if (Number.isFinite(parsed) && parsed > 0) return parsed
  return new Date().getUTCFullYear()
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const json = await request.json()
    const parsed = generateInvoiceSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }
    const { paymentId, type, persist } = parsed.data

    const [payment, company] = await Promise.all([
      paymentRepo.findById(paymentId),
      getCompanyInfo(),
    ])
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const guard = assertCanGenerateInvoice(payment, type)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: 400 })
    }

    let client: Client | undefined
    if (REGULAR_INVOICE_TYPES.has(type) && payment.clientId) {
      const clientDoc = await clientRepo.findById(payment.clientId)
      if (!clientDoc) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }
      client = clientDoc
    }

    const year = paymentYearFromDate(payment.date)
    const invoiceNumber = await getNextInvoiceNumber(type, year)
    const id = formatInvoiceNumber(type, year, invoiceNumber)

    const pdfBuffer = await generateInvoicePdf({
      payment,
      client,
      invoiceNumber,
      series: type,
      company,
    })

    let blobUrl: string | undefined
    let blobPathname: string | undefined
    if (persist === true) {
      const filename = `${id}-${paymentId}.pdf`
      const blob = await put(filename, pdfBuffer, {
        access: "private",
        contentType: "application/pdf",
      })
      blobUrl = blob.url
      blobPathname = blob.pathname
    }

    const invoiceMetadata: InvoiceMetadata = {
      type,
      id,
      generatedAt: new Date(),
      ...(blobUrl ? { blobUrl } : {}),
      ...(blobPathname ? { blobPathname } : {}),
    }

    const appended = await paymentRepo.appendInvoice(paymentId, invoiceMetadata)
    if (!appended) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const previousInvoices = getPaymentInvoices(payment)
    const invoices: InvoiceMetadata[] = [...previousInvoices, invoiceMetadata]

    const downloadUrl = `/api/invoices/${paymentId}/${encodeURIComponent(id)}`

    return NextResponse.json(
      {
        success: true,
        invoice: invoiceMetadata,
        invoices,
        id,
        type,
        downloadUrl,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(`Error generating invoice: ${error}`)
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    )
  }
}
