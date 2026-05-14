import { type NextRequest, NextResponse } from "next/server"
import { MongoEventRepository } from "@/lib/adapters/repositories/mongo-event-repository"
import { requireAuth } from "@/lib/api-auth"
import { deriveEventDate } from "@/lib/domain/services/event-pricing"
import {
  createEventSchema,
  deleteEventSchema,
  eventQuerySchema,
  updateEventSchema,
} from "@/lib/domain/services/event-validator"
import { zodError } from "@/lib/validation"

const events = new MongoEventRepository()

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = eventQuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const result = await events.findAll({
      year: parsed.data.year,
      month: parsed.data.month,
    })

    console.log(
      `Fetched ${result.length} events for filter: ${JSON.stringify(parsed.data)}`
    )
    return NextResponse.json({ events: result }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching events: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = createEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const data = parsed.data
    const date = deriveEventDate(data.year, data.month, data.day)
    const now = new Date()

    const id = await events.create({
      title: data.title,
      description: data.description,
      year: data.year,
      month: data.month,
      day: data.day,
      hour: data.hour,
      minute: data.minute,
      date,
      durationMinutes: data.durationMinutes,
      maxAttendees: data.maxAttendees,
      netAmount: data.netAmount,
      vatAmount: data.vatAmount,
      attendees: [],
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error(`Error creating event: ${error}`)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = updateEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const { id, ...fields } = parsed.data

    // Compute derived date from the merged year/month/day (existing + patch)
    // — the client never sets `date` directly.
    const existing = await events.findById(id)
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const dateRelevant =
      fields.year !== undefined ||
      fields.month !== undefined ||
      fields.day !== undefined
    const mergedYear = fields.year ?? existing.year
    const mergedMonth = fields.month ?? existing.month
    const mergedDay = fields.day ?? existing.day

    const updateData: Record<string, unknown> = { ...fields }
    if (dateRelevant) {
      updateData.date = deriveEventDate(mergedYear, mergedMonth, mergedDay)
    }

    const updated = await events.update(id, updateData)
    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error updating event: ${error}`)
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = deleteEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const deleted = await events.delete(parsed.data.id)
    if (!deleted) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting event: ${error}`)
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    )
  }
}
