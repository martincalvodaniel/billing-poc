import { type NextRequest, NextResponse } from "next/server"
import { MongoEventRepository } from "@/lib/adapters/repositories/mongo-event-repository"
import { requireAuth } from "@/lib/api-auth"

const events = new MongoEventRepository()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      )
    }

    const event = await events.findById(id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching event: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    )
  }
}
