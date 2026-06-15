import "server-only"

import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoAbsenceRepository } from "@/lib/db/repositories/mongo-absence-repository"

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
