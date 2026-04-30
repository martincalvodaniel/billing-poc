import { put } from "@vercel/blob";
import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { getNextInvoiceNumber } from "@/lib/invoiceCounters";
import { generateInvoicePdf } from "@/lib/invoicePdf";
import { getDatabase } from "@/lib/mongodb";
import type { Client, InvoiceMetadata, InvoiceSeries, Payment } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, series } = body;

    // Validate required fields
    if (!paymentId || !series) {
      return NextResponse.json(
        { error: "Missing required fields (paymentId, series)" },
        { status: 400 },
      );
    }

    // Validate series
    const validSeries: InvoiceSeries[] = [
      "Invoice",
      "RectificativeInvoice",
      "SimpleInvoice",
      "RectificativeSimpleInvoice",
    ];
    if (!validSeries.includes(series)) {
      return NextResponse.json({ error: "Invalid invoice series" }, { status: 400 });
    }

    const db = await getDatabase();

    // Start payment fetch and invoice number generation in parallel (async-parallel)
    const paymentId_oid = new ObjectId(paymentId);
    const [payment, invoiceNumber] = await Promise.all([
      db.collection<Payment>("payments").findOne({ _id: paymentId_oid }),
      getNextInvoiceNumber(series),
    ]);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if income payment (only income can have generated invoices)
    if (payment.type !== "income") {
      return NextResponse.json(
        { error: "Only income payments can have generated invoices" },
        { status: 400 },
      );
    }

    // Check if invoice already exists
    if (payment.invoice) {
      return NextResponse.json(
        { error: "Invoice already generated for this payment" },
        { status: 400 },
      );
    }

    // Fetch client if associated
    let client: Client | undefined;
    if (payment.clientId) {
      const clientDoc = await db.collection<Client>("clients").findOne({
        _id: payment.clientId,
      });
      if (clientDoc) {
        client = clientDoc;
      }
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePdf({
      payment,
      client,
      invoiceNumber,
      series,
    });

    // Upload to Vercel Blob
    const filename = `${series}-${String(invoiceNumber).padStart(6, "0")}-${paymentId}.pdf`;
    const blob = await put(filename, pdfBuffer, {
      access: "private",
      contentType: "application/pdf",
    });

    // Update payment with invoice metadata
    const invoiceMetadata: InvoiceMetadata = {
      series,
      number: invoiceNumber,
      generatedAt: new Date(),
      blobUrl: blob.url,
      blobPathname: blob.pathname,
    };

    await db.collection<Payment>("payments").updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          invoice: invoiceMetadata,
          updatedAt: new Date(),
        },
      },
    );

    // Return a proxy URL so the client can download via the server (no direct blob token needed)
    const downloadUrl = `/api/invoices/${paymentId}`;

    return NextResponse.json(
      {
        success: true,
        invoice: invoiceMetadata,
        downloadUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(`Error generating invoice: ${error}`);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
