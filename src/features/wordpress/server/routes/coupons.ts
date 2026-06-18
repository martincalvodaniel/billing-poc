import { type NextRequest, NextResponse } from "next/server"
import {
  createWordPressCoupon,
  fetchWordPressCouponsPage,
  WordPressApiError,
} from "@/features/wordpress/server/api"
import { requireAuth } from "@/lib/auth/require-auth"
import { zodError } from "@/lib/utils/validation"
import {
  createWordpressCouponSchema,
  wordpressCouponsQuerySchema,
} from "@/schemas/wordpress-validator"

function wordpressErrorResponse(error: unknown, fallback: string) {
  if (error instanceof WordPressApiError) {
    const status =
      error.status >= 400 && error.status < 600 ? error.status : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  console.error(`${fallback}: ${error}`)
  return NextResponse.json({ error: fallback }, { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const parsed = wordpressCouponsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    )
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    return NextResponse.json(
      await fetchWordPressCouponsPage(parsed.data.page),
      { status: 200 }
    )
  } catch (error) {
    return wordpressErrorResponse(error, "Failed to fetch WordPress coupons")
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body: unknown = await request.json()
    const parsed = createWordpressCouponSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const coupon = await createWordPressCoupon(parsed.data)
    return NextResponse.json({ success: true, coupon }, { status: 201 })
  } catch (error) {
    return wordpressErrorResponse(error, "Failed to create WordPress coupon")
  }
}
