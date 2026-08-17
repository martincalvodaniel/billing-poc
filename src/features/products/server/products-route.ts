import "server-only"

import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoProductRepository } from "@/lib/db/repositories/mongo-product-repository"
import { zodError } from "@/lib/utils/validation"
import {
  createProductSchema,
  deleteProductSchema,
  productQuerySchema,
  updateProductSchema,
} from "@/schemas/product-validator"

const products = new MongoProductRepository()

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const tagParams = request.nextUrl.searchParams
      .getAll("tag")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    const params = {
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      tags: tagParams.length > 0 ? tagParams : undefined,
    }
    const parsed = productQuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const result = await products.findAll({
      search: parsed.data.search,
      tags: parsed.data.tags,
    })
    console.log(`Fetched ${result.length} products`)
    return NextResponse.json({ products: result }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching products: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const id = await products.create({
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error(`Error creating product: ${error}`)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const { id, ...fields } = parsed.data
    const updated = await products.update(id, fields)
    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error updating product: ${error}`)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = deleteProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const deleted = await products.delete(parsed.data.id)
    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting product: ${error}`)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}
