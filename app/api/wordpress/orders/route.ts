import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { wordpressOrdersQuerySchema } from "@/lib/domain/services/wordpress-validator"
import { zodError } from "@/lib/validation"
import {
  fetchWordPressOrdersPage,
  WordPressApiError,
} from "@/lib/wordpress-api"

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = wordpressOrdersQuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const result = await fetchWordPressOrdersPage(parsed.data.page)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof WordPressApiError) {
      const status =
        error.status >= 400 && error.status < 600 ? error.status : 500
      return NextResponse.json({ error: error.message }, { status })
    }

    console.error(`Error fetching WordPress orders: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch WordPress orders" },
      { status: 500 }
    )
  }
}
