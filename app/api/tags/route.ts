import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { Payment, PaymentType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as PaymentType | null;

    const db = await getDatabase();

    // Build aggregation pipeline
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      {
        $match: {
          tag: { $type: "string", $ne: "" },
        },
      },
    ];

    // Add type filter if provided
    if (type && (type === "income" || type === "outcome")) {
      pipeline[0].$match.type = type;
    }

    pipeline.push(
      {
        $group: {
          _id: null,
          tags: {
            $addToSet: "$tag",
          },
        },
      },
      {
        $project: {
          _id: 0,
          tags: 1,
        },
      },
    );

    const result = await db.collection<Payment>("payments").aggregate(pipeline).toArray();

    // Extract unique tags from the result
    const uniqueTags = result.length > 0 ? result[0].tags : [];

    return NextResponse.json({ tags: uniqueTags }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching tags: ${error}`);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
