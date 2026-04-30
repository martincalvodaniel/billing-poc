import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { Payment } from "@/lib/types";

export async function GET() {
  try {
    const db = await getDatabase();
    const payments = await db
      .collection<Payment>("payments")
      .find({})
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, date, total, vat } = body;

    // Validate required fields
    if (!type || !date || total === undefined || vat === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const totalAmount = parseFloat(total);
    const vatPercentage = parseFloat(vat);

    if (isNaN(totalAmount) || isNaN(vatPercentage)) {
      return NextResponse.json(
        { error: "Invalid numeric values" },
        { status: 400 }
      );
    }

    if (vatPercentage < 0 || vatPercentage > 100) {
      return NextResponse.json(
        { error: "VAT percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    const netAmount = totalAmount / (1 + vatPercentage / 100);
    const vatAmount = totalAmount - netAmount;
    const payment: Omit<Payment, "_id"> = {
      type,
      date,
      netAmount,
      vat: vatAmount,
      total: totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    const result = await db.collection<Payment>("payments").insertOne(payment as Payment);

    return NextResponse.json(
      { success: true, id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
