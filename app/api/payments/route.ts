import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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
    const { type, date, total, vat, tag } = body;

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
      tag: tag || undefined,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, date, type, tag } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle date update
    if (date !== undefined) {
      if (!date) {
        return NextResponse.json(
          { error: "Date cannot be empty" },
          { status: 400 }
        );
      }
      updateData.date = date;
    }

    // Handle type update
    if (type !== undefined) {
      if (type !== "income" && type !== "outcome") {
        return NextResponse.json(
          { error: "Type must be either 'income' or 'outcome'" },
          { status: 400 }
        );
      }
      updateData.type = type;
    }

    // Handle tag update
    if (tag !== undefined) {
      // Convert empty string to null for storage
      updateData.tag = tag ? tag : null;
    }

    // Ensure at least one field is being updated
    if (!date && !type && tag === undefined) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<Payment>("payments").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
