import { type NextRequest, NextResponse } from "next/server"
import { MongoAbsenceRepository } from "@/lib/adapters/repositories/mongo-absence-repository"
import { MongoClientRepository } from "@/lib/adapters/repositories/mongo-client-repository"
import { requireAuth } from "@/lib/api-auth"
import { mergeStudentNames } from "@/lib/domain/services/absence-summary"
import { absenceStudentsQuerySchema } from "@/lib/domain/services/absence-validator"
import { zodError } from "@/lib/validation"

const absenceRepo = new MongoAbsenceRepository()
const clientRepo = new MongoClientRepository()

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = absenceStudentsQuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const q = parsed.data.q ?? ""
    const [absenceNames, clients] = await Promise.all([
      absenceRepo.findDistinctStudentNames(q || undefined),
      clientRepo.findAll({ page: 1, pageSize: 1000, search: q || undefined }),
    ])
    const lower = q.toLowerCase()
    const clientNames = clients.items
      .map((c) => c.name)
      .filter((n) => !lower || n.toLowerCase().includes(lower))
    const students = mergeStudentNames(absenceNames, clientNames)
    return NextResponse.json({ students }, { status: 200 })
  } catch (error) {
    console.error(`Error in GET /api/absences/students: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch absence students" },
      { status: 500 }
    )
  }
}
