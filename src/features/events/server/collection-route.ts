import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoEventRepository } from "@/lib/db/repositories/mongo-event-repository"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
import { recomputeAllAttendeePayments } from "@/lib/domain/services/event-payment-service"
import { deriveEventDate } from "@/lib/domain/services/event-pricing"
import { zodError } from "@/lib/utils/validation"
import {
  createEventSchema,
  deleteEventSchema,
  eventQuerySchema,
  updateEventSchema,
} from "@/schemas/event-validator"

const events = new MongoEventRepository()
const payments = new MongoPaymentRepository()

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
      tag: data.tag,
      year: data.year,
      month: data.month,
      day: data.day,
      dayOfWeek: data.dayOfWeek,
      hour: data.hour,
      minute: data.minute,
      date,
      durationMinutes: data.durationMinutes,
      maxAttendees: data.maxAttendees,
      pricePerSeat: data.pricePerSeat,
      vatRate: data.vatRate,
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

    // Re-fetch the persisted event and refresh linked attendee payments
    // (price, occurrences and tag may have changed). Already-invoiced
    // payments are silently skipped.
    const refreshed = await events.findById(id)
    let paymentSync: {
      updated: number
      skippedInvoiced: number
      missing: number
    } | null = null
    if (refreshed?.attendees.some((a) => a.paymentId)) {
      const r = await recomputeAllAttendeePayments(refreshed, { payments })
      paymentSync = {
        updated: r.updated.length,
        skippedInvoiced: r.skippedInvoiced.length,
        missing: r.missing.length,
      }
    }

    return NextResponse.json(
      paymentSync ? { success: true, paymentSync } : { success: true },
      { status: 200 }
    )
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
