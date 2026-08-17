import "server-only"

import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoProductRepository } from "@/lib/db/repositories/mongo-product-repository"

const products = new MongoProductRepository()

export async function GET() {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const tags = await products.findDistinctTags()
    return NextResponse.json({ tags }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching product tags: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch product tags" },
      { status: 500 }
    )
  }
}
