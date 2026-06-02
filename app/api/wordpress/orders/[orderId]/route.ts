import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import {
  updateWordpressOrderStatusSchema,
  wordpressOrderParamsSchema,
} from "@/lib/domain/services/wordpress-validator"
import { zodError } from "@/lib/validation"
import {
  updateWordPressOrderStatus,
  WordPressApiError,
} from "@/lib/wordpress-api"

interface WordPressOrderRouteParams {
  params: Promise<{ orderId: string }>
}

export async function PUT(
  request: NextRequest,
  { params }: WordPressOrderRouteParams
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const parsedParams = wordpressOrderParamsSchema.safeParse(await params)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: zodError(parsedParams.error) },
        { status: 400 }
      )
    }

    const body: unknown = await request.json()
    const parsedBody = updateWordpressOrderStatusSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: zodError(parsedBody.error) },
        { status: 400 }
      )
    }

    const order = await updateWordPressOrderStatus(
      parsedParams.data.orderId,
      parsedBody.data.status
    )

    return NextResponse.json({ success: true, order }, { status: 200 })
  } catch (error) {
    if (error instanceof WordPressApiError) {
      const status =
        error.status >= 400 && error.status < 600 ? error.status : 500
      return NextResponse.json({ error: error.message }, { status })
    }

    console.error(`Error updating WordPress order status: ${error}`)
    return NextResponse.json(
      { error: "Failed to update WordPress order status" },
      { status: 500 }
    )
  }
}
