import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoEventRepository } from "@/lib/db/repositories/mongo-event-repository"

const events = new MongoEventRepository()

function resolveYearMonth(event: {
  year?: number
  month?: number
  date?: string
}): { year?: number; month?: number } {
  if (event.year && event.month) {
    return { year: event.year, month: event.month }
  }
  if (event.date) {
    const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(event.date)
    if (match) {
      return { year: Number(match[1]), month: Number(match[2]) }
    }
  }
  return {}
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { paymentId } = await params
    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      )
    }

    const allEvents = await events.findAll({})
    const linked = allEvents.find((event) =>
      event.attendees.some((attendee) => attendee.paymentId === paymentId)
    )

    if (!linked?._id) {
      return NextResponse.json({ event: null }, { status: 200 })
    }

    const { year, month } = resolveYearMonth(linked)
    return NextResponse.json(
      {
        event: {
          id: linked._id,
          title: linked.title,
          date: linked.date,
          day: linked.day,
          dayOfWeek: linked.dayOfWeek,
          hour: linked.hour,
          minute: linked.minute,
          year,
          month,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`Error finding event by payment: ${error}`)
    return NextResponse.json(
      { error: "Failed to find linked event" },
      { status: 500 }
    )
  }
}
