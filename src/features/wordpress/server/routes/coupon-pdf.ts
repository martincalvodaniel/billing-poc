import { type NextRequest, NextResponse } from "next/server"
import {
  fetchWordPressCoupon,
  WordPressApiError,
} from "@/features/wordpress/server/api"
import { requireAuth } from "@/lib/auth/require-auth"
import { buildInlinePdfResponse } from "@/lib/pdf/http"
import { generateWordPressGiftCardPdf } from "@/lib/pdf/wordpressGiftCardPdf"
import { zodError } from "@/lib/utils/validation"
import {
  wordpressCouponParamsSchema,
  wordpressCouponPdfQuerySchema,
} from "@/schemas/wordpress-validator"
import { getCouponPdfDisplayExpiryDate } from "./coupon-pdf-utils"

interface WordPressCouponPdfRouteParams {
  params: Promise<{ couponId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: WordPressCouponPdfRouteParams
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const parsedParams = wordpressCouponParamsSchema.safeParse(await params)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: zodError(parsedParams.error) },
        { status: 400 }
      )
    }

    const parsedQuery = wordpressCouponPdfQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    )
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: zodError(parsedQuery.error) },
        { status: 400 }
      )
    }

    const coupon = await fetchWordPressCoupon(parsedParams.data.couponId)
    const pdf = await generateWordPressGiftCardPdf({
      code: coupon.code,
      expiryDate: getCouponPdfDisplayExpiryDate(parsedQuery.data.expires),
    })

    return buildInlinePdfResponse(
      new Uint8Array(pdf),
      `tarjeta-regalo-${coupon.code}.pdf`
    )
  } catch (error) {
    if (error instanceof WordPressApiError) {
      const status =
        error.status >= 400 && error.status < 600 ? error.status : 500
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error(`Failed to generate WordPress coupon PDF: ${error}`)
    return NextResponse.json(
      { error: "Failed to generate WordPress coupon PDF" },
      { status: 500 }
    )
  }
}
