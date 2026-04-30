import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import { getDatabase } from "@/lib/mongodb";
import { Payment, Client, InvoiceSeries, InvoiceMetadata } from "@/lib/types";
import { generateInvoicePdf } from "@/lib/invoicePdf";
import { getNextInvoiceNumber } from "@/lib/invoiceCounters";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, series } = body;

    // Validate required fields
    if (!paymentId || !series) {
      return NextResponse.json(
        { error: "Missing required fields (paymentId, series)" },
        { status: 400 }
      );
    }

    // Validate series
    const validSeries: InvoiceSeries[] = ["Invoice", "RectificativeInvoice", "SimpleInvoice", "RectificativeSimpleInvoice"];
    if (!validSeries.includes(series)) {
      return NextResponse.json(
        { error: "Invalid invoice series" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Fetch payment
    const payment = await db.collection<Payment>("payments").findOne({
      _id: new ObjectId(paymentId),
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Check if income payment (only income can have generated invoices)
    if (payment.type !== "income") {
      return NextResponse.json(
        { error: "Only income payments can have generated invoices" },
        { status: 400 }
      );
    }

    // Check if invoice already exists
    if (payment.invoice) {
      return NextResponse.json(
        { error: "Invoice already generated for this payment" },
        { status: 400 }
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

    // Get next invoice number for the series
    const invoiceNumber = await getNextInvoiceNumber(series);

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
      access: "public",
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
      }
    );

    return NextResponse.json(
      {
        success: true,
        invoice: invoiceMetadata,
        downloadUrl: blob.url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(`Error generating invoice: ${error}`);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
