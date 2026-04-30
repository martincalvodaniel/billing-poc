import { NextResponse } from "next/server"
import { MongoAbsenceRepository } from "@/lib/adapters/repositories/mongo-absence-repository"
import { requireAuth } from "@/lib/api-auth"

const absences = new MongoAbsenceRepository()

export async function GET() {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const rows = await absences.aggregateSummary()
    return NextResponse.json({ rows }, { status: 200 })
  } catch (error) {
    console.error(`Error in GET /api/absences/summary: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch absence summary" },
      { status: 500 }
    )
  }
}
