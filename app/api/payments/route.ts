import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { Payment, PaymentConcept } from "@/lib/types";

// Type for raw concept from request body (amount and quantity may be string or number)
interface RawPaymentConcept {
  name: string;
  amount: string | number;
  quantity?: string | number; // Optional; defaults to 1 if omitted
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const db = await getDatabase();
    
    // Build filter based on query parameters
    const filter: Record<string, unknown> = {};
    
    if (year && month) {
      // Filter by specific month and year
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: "Invalid year or month parameters" },
          { status: 400 }
        );
      }
      
      // Create date range for the month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      
      filter.date = {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0],
      };
    } else if (year) {
      // Filter by year only
      const yearNum = parseInt(year);
      
      if (isNaN(yearNum)) {
        return NextResponse.json(
          { error: "Invalid year parameter" },
          { status: 400 }
        );
      }
      
      // Create date range for the year
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
      
      filter.date = {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0],
      };
    }

    const payments = await db
      .collection<Payment>("payments")
      .find(filter)
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    console.log(`Fetched ${payments.length} payments from database for filter: ${JSON.stringify(filter)}`);

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
    const { type, date, concepts, vat, tag } = body;

    // Validate required fields
    if (!type || !date) {
      return NextResponse.json(
        { error: "Missing required fields (type, date)" },
        { status: 400 }
      );
    }

    // Support both new format (concepts) and legacy format (total)
    let paymentConcepts = concepts;
    if (!concepts && body.total !== undefined && vat !== undefined) {
      // Legacy format: convert single total to concepts array
      paymentConcepts = [{ amount: parseFloat(body.total) }];
    }

    if (!paymentConcepts || !Array.isArray(paymentConcepts) || paymentConcepts.length === 0) {
      return NextResponse.json(
        { error: "At least one concept is required" },
        { status: 400 }
      );
    }

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

    // Validate and normalize concepts
    const normalizedConcepts = paymentConcepts.map((concept: RawPaymentConcept): PaymentConcept => ({
      name: concept.name,
      amount: parseFloat(String(concept.amount)),
      quantity: concept.quantity ? parseFloat(String(concept.quantity)) : 1,
    }));

    // Check for missing or empty names
    if (normalizedConcepts.some((c: PaymentConcept) => !c.name || c.name.trim() === "")) {
      return NextResponse.json(
        { error: "All concepts must have a name" },
        { status: 400 }
      );
    }

    // Check for invalid amounts
    if (normalizedConcepts.some((c: PaymentConcept) => isNaN(c.amount))) {
      return NextResponse.json(
        { error: "Invalid concept amount" },
        { status: 400 }
      );
    }

    // Calculate totals from concepts (amount × quantity per concept)
    const totalAmount = normalizedConcepts.reduce((sum: number, c: PaymentConcept) => sum + (c.amount * c.quantity), 0);
    const netAmount = totalAmount / (1 + vatPercentage / 100);
    const vatAmount = totalAmount - netAmount;

    const payment: Omit<Payment, "_id"> = {
      type,
      date,
      tag: tag || undefined,
      concepts: normalizedConcepts,
      vat: vatPercentage,
      netAmount,
      vatAmount,
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
    const { id, date, type, tag, concepts, vat, total } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const db = await getDatabase();

    // Get current payment for calculations
    let payment: Payment | null = null;
    if (concepts !== undefined || total !== undefined || vat !== undefined) {
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
      updateData.tag = tag ? tag : null;
    }

    // Handle concepts update
    if (concepts !== undefined) {
      if (!Array.isArray(concepts) || concepts.length === 0) {
        return NextResponse.json(
          { error: "At least one concept is required" },
          { status: 400 }
        );
      }

      const normalizedConcepts = concepts.map((concept: RawPaymentConcept): PaymentConcept => ({
        name: concept.name,
        amount: parseFloat(String(concept.amount)),
        quantity: concept.quantity ? parseFloat(String(concept.quantity)) : 1,
      }));

      if (normalizedConcepts.some((c: PaymentConcept) => !c.name || c.name.trim() === "")) {
        return NextResponse.json(
          { error: "All concepts must have a name" },
          { status: 400 }
        );
      }

      if (normalizedConcepts.some((c: PaymentConcept) => isNaN(c.amount))) {
        return NextResponse.json(
          { error: "Invalid concept amount" },
          { status: 400 }
        );
      }

      updateData.concepts = normalizedConcepts;

      // Recalculate totals (amount × quantity per concept)
      const totalAmount = normalizedConcepts.reduce((sum: number, c: PaymentConcept) => sum + (c.amount * c.quantity), 0);
      const vatPercentage = vat !== undefined ? parseFloat(vat) : payment!.vat;
      const netAmount = totalAmount / (1 + vatPercentage / 100);
      const vatAmount = totalAmount - netAmount;

      updateData.total = totalAmount;
      updateData.netAmount = netAmount;
      updateData.vatAmount = vatAmount;
    }

    // Handle VAT percentage update
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

      updateData.vat = vatPercentage;

      // Recalculate with new VAT
      const totalAmount = total !== undefined ? parseFloat(total) : payment!.total;
      const netAmount = totalAmount / (1 + vatPercentage / 100);
      const vatAmount = totalAmount - netAmount;

      updateData.netAmount = netAmount;
      updateData.vatAmount = vatAmount;
    }

    // Handle total update (legacy - convert to concepts)
    if (total !== undefined && concepts === undefined) {
      const totalAmount = parseFloat(total);
      if (isNaN(totalAmount)) {
        return NextResponse.json(
          { error: "Invalid total amount" },
          { status: 400 }
        );
      }

      const vatPercentage = vat !== undefined ? parseFloat(vat) : payment!.vat;
      const netAmount = totalAmount / (1 + vatPercentage / 100);
      const vatAmount = totalAmount - netAmount;

      updateData.total = totalAmount;
      updateData.netAmount = netAmount;
      updateData.vatAmount = vatAmount;
    }

    // Ensure at least one field is being updated
    if (
      date === undefined &&
      type === undefined &&
      tag === undefined &&
      concepts === undefined &&
      total === undefined &&
      vat === undefined
    ) {
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

    return NextResponse.json(
      {
        success: true,
        total: updateData.total,
        vatAmount: updateData.vatAmount,
        netAmount: updateData.netAmount,
        vat: updateData.vat,
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
