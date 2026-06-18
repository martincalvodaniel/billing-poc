import { NextResponse } from "next/server"
import {
  deleteWordPressCoupon,
  WordPressApiError,
} from "@/features/wordpress/server/api"
import { requireAuth } from "@/lib/auth/require-auth"
import { zodError } from "@/lib/utils/validation"
import { wordpressCouponParamsSchema } from "@/schemas/wordpress-validator"

interface WordPressCouponRouteParams {
  params: Promise<{ couponId: string }>
}

export async function DELETE(
  _request: Request,
  { params }: WordPressCouponRouteParams
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const parsed = wordpressCouponParamsSchema.safeParse(await params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const coupon = await deleteWordPressCoupon(parsed.data.couponId)
    return NextResponse.json({ success: true, coupon }, { status: 200 })
  } catch (error) {
    if (error instanceof WordPressApiError) {
      const status =
        error.status >= 400 && error.status < 600 ? error.status : 500
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error(`Failed to delete WordPress coupon: ${error}`)
    return NextResponse.json(
      { error: "Failed to delete WordPress coupon" },
      { status: 500 }
    )
  }
}
