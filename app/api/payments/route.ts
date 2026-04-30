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
    const { type, date, netAmount, vat } = body;

    // Validate required fields
    if (!type || !date || netAmount === undefined || vat === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const net = parseFloat(netAmount);
    const vatAmount = parseFloat(vat);

    if (isNaN(net) || isNaN(vatAmount)) {
      return NextResponse.json(
        { error: "Invalid numeric values" },
        { status: 400 }
      );
    }

    const payment: Omit<Payment, "_id"> = {
      type,
      date,
      netAmount: net,
      vat: vatAmount,
      total: net + vatAmount,
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
