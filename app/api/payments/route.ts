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
    console.error(`Error fetching payments: ${error}`);
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
    console.error(`Error creating payment: ${error}`);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, date, type, tag, total, vat } = body;

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

    const db = await getDatabase();

    // Get current payment if we need it for calculations
    let payment: Payment | null = null;
    if (total !== undefined || vat !== undefined) {
      payment = await db.collection<Payment>("payments").findOne({
        _id: new ObjectId(id),
      });

      if (!payment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }
    }

    // Handle total update - need to recalculate VAT and net amount
    if (total !== undefined) {
      const totalAmount = parseFloat(total);
      if (isNaN(totalAmount)) {
        return NextResponse.json(
          { error: "Invalid total amount" },
          { status: 400 }
        );
      }

      // Calculate VAT percentage from current values
      const currentVatPercentage = (payment!.vat / payment!.netAmount) * 100;
      const newNetAmount = totalAmount / (1 + currentVatPercentage / 100);
      const newVatAmount = totalAmount - newNetAmount;

      updateData.total = totalAmount;
      updateData.vat = newVatAmount;
      updateData.netAmount = newNetAmount;
    }

    // Handle VAT percentage update - need to recalculate net amount and VAT amount
    if (vat !== undefined) {
      const vatPercentage = parseFloat(vat);
      if (isNaN(vatPercentage)) {
        return NextResponse.json(
          { error: "Invalid VAT percentage" },
          { status: 400 }
        );
      }

      if (vatPercentage < 0 || vatPercentage > 100) {
        return NextResponse.json(
          { error: "VAT percentage must be between 0 and 100" },
          { status: 400 }
        );
      }

      // Use the new total if it was provided, otherwise use current total
      const totalAmount = total !== undefined ? parseFloat(total) : payment!.total;
      const newNetAmount = totalAmount / (1 + vatPercentage / 100);
      const newVatAmount = totalAmount - newNetAmount;

      updateData.vat = newVatAmount;
      updateData.netAmount = newNetAmount;
    }

    // Ensure at least one field is being updated
    if (!date && !type && tag === undefined && total === undefined && vat === undefined) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

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

    // Return updated values for client-side optimistic update
    return NextResponse.json(
      {
        success: true,
        total: updateData.total,
        vat: updateData.vat,
        netAmount: updateData.netAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error updating payment: ${error}`);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const result = await db.collection<Payment>("payments").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
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
    console.error(`Error deleting payment: ${error}`);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
}
