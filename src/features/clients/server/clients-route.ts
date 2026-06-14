import "server-only"

import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoClientRepository } from "@/lib/db/repositories/mongo-client-repository"
import { zodError } from "@/lib/utils/validation"
import {
  clientQuerySchema,
  createClientSchema,
  deleteClientSchema,
  updateClientSchema,
} from "@/schemas/client-validator"

const clients = new MongoClientRepository()

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = clientQuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const result = await clients.findAll(parsed.data)

    console.log(
      `Fetched ${result.items.length} clients (page ${result.pagination.page}/${result.pagination.totalPages})`
    )
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error(`Error fetching clients: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = createClientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const id = await clients.create({
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error(`Error creating client: ${error}`)
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = updateClientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const { id, ...fields } = parsed.data
    const updated = await clients.update(id, fields)
    if (!updated) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error updating client: ${error}`)
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = deleteClientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const deleted = await clients.delete(parsed.data.id)
    if (!deleted) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting client: ${error}`)
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    )
  }
}
