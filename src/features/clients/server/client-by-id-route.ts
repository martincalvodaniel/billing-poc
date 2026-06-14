import "server-only"

import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoClientRepository } from "@/lib/db/repositories/mongo-client-repository"

const clients = new MongoClientRepository()

interface ClientRouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: ClientRouteParams) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Missing client ID" }, { status: 400 })
    }

    const client = await clients.findById(id)
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json(client, { status: 200 })
  } catch (error) {
    console.error(`Error fetching client by id: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    )
  }
}
