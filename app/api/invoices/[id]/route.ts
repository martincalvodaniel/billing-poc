import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { Payment } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Fetch payment
    const payment = await db.collection<Payment>("payments").findOne({
      _id: new ObjectId(id),
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Check if payment has invoice or provider bill
    if (payment.type === "income" && payment.invoice) {
      return NextResponse.json({
        type: "invoice",
        url: payment.invoice.blobUrl,
        series: payment.invoice.series,
        number: payment.invoice.number,
        generatedAt: payment.invoice.generatedAt,
      });
    } else if (payment.type === "outcome" && payment.providerBillUrl) {
      return NextResponse.json({
        type: "providerBill",
        url: payment.providerBillUrl,
      });
    } else {
      return NextResponse.json(
        { error: "No invoice or provider bill found for this payment" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error(`Error retrieving invoice: ${error}`);
    return NextResponse.json(
      { error: "Failed to retrieve invoice" },
      { status: 500 }
    );
  }
}
