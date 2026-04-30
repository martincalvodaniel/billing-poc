import { type NextRequest, NextResponse } from "next/server"
import { MongoAbsenceRepository } from "@/lib/adapters/repositories/mongo-absence-repository"
import { requireAuth } from "@/lib/api-auth"
import {
  absenceQuerySchema,
  createAbsenceSchema,
  deleteAbsenceSchema,
  updateAbsenceSchema,
} from "@/lib/domain/services/absence-validator"
import { zodError } from "@/lib/validation"

const absences = new MongoAbsenceRepository()

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = absenceQuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const result = await absences.findAll({
      year: parsed.data.year,
      month: parsed.data.month,
    })

    console.log(
      `Fetched ${result.length} absences for filter: ${JSON.stringify(parsed.data)}`
    )
    return NextResponse.json({ absences: result }, { status: 200 })
  } catch (error) {
    console.error(`Error in GET /api/absences: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch absences" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = createAbsenceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const now = new Date()
    const id = await absences.create({
      type: parsed.data.type,
      studentName: parsed.data.studentName,
      date: parsed.data.date,
      comment: parsed.data.comment,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error(`Error in POST /api/absences: ${error}`)
    return NextResponse.json(
      { error: "Failed to create absence" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = updateAbsenceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const { id, ...data } = parsed.data
    const updated = await absences.update(id, data)
    if (!updated) {
      return NextResponse.json({ error: "Absence not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error in PUT /api/absences: ${error}`)
    return NextResponse.json(
      { error: "Failed to update absence" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = deleteAbsenceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const deleted = await absences.delete(parsed.data.id)
    if (!deleted) {
      return NextResponse.json({ error: "Absence not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error in DELETE /api/absences: ${error}`)
    return NextResponse.json(
      { error: "Failed to delete absence" },
      { status: 500 }
    )
  }
}
