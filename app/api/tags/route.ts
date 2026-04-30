import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { Payment, PaymentType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as PaymentType | null;

    const db = await getDatabase();
    
    // Build filter based on type parameter
    const filter = { tag: { $exists: true, $ne: "" } };
    if (type && (type === "income" || type === "outcome")) {
      Object.assign(filter, { type });
    }

    const payments = await db
      .collection<Payment>("payments")
      .find(filter)
      .project({ tag: 1 })
      .toArray();

    // Extract unique tags
    const uniqueTags = Array.from(
      new Set(payments.map((p) => p.tag).filter(Boolean))
    ) as string[];

    return NextResponse.json({ tags: uniqueTags }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
