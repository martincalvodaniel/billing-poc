import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import { getDatabase } from "@/lib/mongodb";
import { Payment } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const paymentId = formData.get("paymentId") as string;

    // Validate required fields
    if (!file || !paymentId) {
      return NextResponse.json(
        { error: "Missing required fields (file, paymentId)" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
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

    // Check if outcome payment (only outcome can have provider bills)
    if (payment.type !== "outcome") {
      return NextResponse.json(
        { error: "Only outcome payments can have provider bills" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const filename = `provider-bill-${paymentId}-${Date.now()}.pdf`;
    const fileBuffer = await file.arrayBuffer();
    const blob = await put(filename, fileBuffer, {
      access: "private",
      contentType: "application/pdf",
    });

    // Update payment with provider bill URL
    await db.collection<Payment>("payments").updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          providerBillUrl: blob.url,
          providerBillPathname: blob.pathname,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        billUrl: blob.url,
        pathname: blob.pathname,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(`Error uploading provider bill: ${error}`);
    return NextResponse.json(
      { error: "Failed to upload provider bill" },
      { status: 500 }
    );
  }
}
