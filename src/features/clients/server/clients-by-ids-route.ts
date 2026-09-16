import "server-only"

import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoClientRepository } from "@/lib/db/repositories/mongo-client-repository"
import { zodError } from "@/lib/utils/validation"
import { clientIdsQuerySchema } from "@/schemas/client-validator"

const clients = new MongoClientRepository()

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const parsed = clientIdsQuerySchema.safeParse({
      ids: request.nextUrl.searchParams.getAll("id"),
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const result = await clients.findByIds(parsed.data.ids)
    return NextResponse.json({ clients: result }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching clients by ids: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}
