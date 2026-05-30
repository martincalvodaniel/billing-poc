import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function POST(_request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    // Wave A patch: this endpoint wrote legacy `providerBillUrl` /
    // `providerBillPathname` top-level fields, which have been removed
    // from the `Payment` type. Wave D deletes the file and replaces it
    // with `/api/payments/[id]/invoices/link` for external URLs (no blob
    // upload). Until then, return 410 Gone.
    return NextResponse.json(
      {
        error:
          "Provider-bill upload endpoint removed — pending replacement by /api/payments/[id]/invoices/link (Wave D).",
      },
      { status: 410 }
    )
  } catch (error) {
    console.error(`Error uploading provider bill: ${error}`)
    return NextResponse.json(
      { error: "Failed to upload provider bill" },
      { status: 500 }
    )
  }
}
