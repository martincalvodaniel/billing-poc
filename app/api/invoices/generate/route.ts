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
} from "@/lib/domain/services/invoice-validator"
import { getNextInvoiceNumber } from "@/lib/invoiceCounters"
import { formatInvoiceNumber, generateInvoicePdf } from "@/lib/invoicePdf"
import { getCompanyInfo } from "@/lib/server-cache"
import { zodError } from "@/lib/validation"

const paymentRepo = new MongoPaymentRepository()
const clientRepo = new MongoClientRepository()

const REGULAR_SERIES = new Set(["Invoice", "RectificativeInvoice"])

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
    const { paymentId, series } = parsed.data

    const [payment, company] = await Promise.all([
      paymentRepo.findById(paymentId),
      getCompanyInfo(),
    ])
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const guard = assertCanGenerateInvoice(payment, series)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: 400 })
    }

    let client: Client | undefined
    if (REGULAR_SERIES.has(series) && payment.clientId) {
      const clientDoc = await clientRepo.findById(payment.clientId)
      if (!clientDoc) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }
      client = clientDoc
    }

    const year = paymentYearFromDate(payment.date)
    const invoiceNumber = await getNextInvoiceNumber(series, year)
    const formattedNumber = formatInvoiceNumber(series, year, invoiceNumber)

    const pdfBuffer = await generateInvoicePdf({
      payment,
      client,
      invoiceNumber,
      series,
      company,
    })

    const filename = `${formattedNumber}-${paymentId}.pdf`
    const blob = await put(filename, pdfBuffer, {
      access: "private",
      contentType: "application/pdf",
    })

    const invoiceMetadata: InvoiceMetadata = {
      series,
      number: invoiceNumber,
      formattedNumber,
      generatedAt: new Date(),
      blobUrl: blob.url,
      blobPathname: blob.pathname,
    }

    const appended = await paymentRepo.appendInvoice(paymentId, invoiceMetadata)
    if (!appended) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const previousInvoices = getPaymentInvoices(payment)
    const invoices: InvoiceMetadata[] = [...previousInvoices, invoiceMetadata]

    const downloadUrl = `/api/invoices/${paymentId}/${series}/${invoiceNumber}`

    return NextResponse.json(
      {
        success: true,
        invoice: invoiceMetadata,
        invoices,
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
