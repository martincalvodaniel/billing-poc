import { ObjectId } from "mongodb"
import type { Absence, AbsenceSummaryRow } from "../../domain/entities/absence"
import type {
  AbsenceFilter,
  AbsenceRepository,
} from "../../domain/ports/absence-repository"
import { getDatabase } from "../../mongodb"
import type { Absence as MongoAbsence } from "../../types"
import { MongoUpdateBuilder, omitNullish } from "./mongo-utils"

export class DuplicateAbsenceError extends Error {
  readonly code = "duplicate_part_of_day" as const

  constructor(message: string) {
    super(message)
    this.name = "DuplicateAbsenceError"
  }
}

function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function toDomain(doc: MongoAbsence): Absence {
  return {
    _id: doc._id?.toString(),
    type: doc.type,
    studentName: doc.studentName,
    date: doc.date,
    partOfDay: doc.partOfDay,
    comment: doc.comment,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false
  const e = err as { code?: unknown; name?: unknown }
  return e.code === 11000 || (e.name === "MongoServerError" && e.code === 11000)
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0")
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export class MongoAbsenceRepository implements AbsenceRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoAbsence>("absences")
  }

  async findAll(filter: AbsenceFilter): Promise<Absence[]> {
    const col = await this.collection()
    const query: Record<string, unknown> = {}

    if (filter.year && filter.month) {
      const last = lastDayOfMonth(filter.year, filter.month)
      query.date = {
        $gte: `${filter.year}-${pad2(filter.month)}-01`,
        $lte: `${filter.year}-${pad2(filter.month)}-${pad2(last)}`,
      }
    } else if (filter.year) {
      query.date = {
        $gte: `${filter.year}-01-01`,
        $lte: `${filter.year}-12-31`,
      }
    }

    if (filter.studentName && filter.studentName.trim() !== "") {
      query.studentNameLower = filter.studentName.trim().toLowerCase()
    }

    const docs = await col
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray()

    return docs.map(toDomain)
  }

  async findById(id: string): Promise<Absence | null> {
    if (!isValidObjectId(id)) return null
    const col = await this.collection()
    const doc = await col.findOne({ _id: toObjectId(id) })
    return doc ? toDomain(doc) : null
  }

  async create(absence: Omit<Absence, "_id">): Promise<string> {
    const col = await this.collection()
    const now = new Date()
    const comment =
      absence.comment !== undefined && absence.comment !== ""
        ? absence.comment
        : undefined
    const doc = omitNullish({
      type: absence.type,
      studentName: absence.studentName,
      studentNameLower: absence.studentName.trim().toLowerCase(),
      date: absence.date,
      partOfDay: absence.partOfDay,
      comment,
      createdAt: absence.createdAt ?? now,
      updatedAt: absence.updatedAt ?? now,
    })
    try {
      const result = await col.insertOne(doc as MongoAbsence)
      return result.insertedId.toString()
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new DuplicateAbsenceError(
          "A record already exists for this student, date, and part of day."
        )
      }
      throw err
    }
  }

  async update(id: string, data: Partial<Absence>): Promise<boolean> {
    const col = await this.collection()
    const builder = new MongoUpdateBuilder().set("updatedAt", new Date())

    if (data.type !== undefined) builder.set("type", data.type)
    if (data.studentName !== undefined) {
      builder.set("studentName", data.studentName)
      builder.set("studentNameLower", data.studentName.trim().toLowerCase())
    }
    if (data.date !== undefined) builder.set("date", data.date)
    if (data.partOfDay !== undefined) builder.set("partOfDay", data.partOfDay)
    // Treat empty string as a request to clear the comment.
    if (data.comment !== undefined) {
      builder.setOrUnset(
        "comment",
        data.comment === "" ? undefined : data.comment
      )
    }

    try {
      const result = await col.updateOne(
        { _id: toObjectId(id) },
        builder.build()
      )
      return result.modifiedCount > 0
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new DuplicateAbsenceError(
          "A record already exists for this student, date, and part of day."
        )
      }
      throw err
    }
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
  }

  async deleteByStudentName(name: string): Promise<number> {
    const col = await this.collection()
    const result = await col.deleteMany({
      studentNameLower: name.trim().toLowerCase(),
    })
    return result.deletedCount ?? 0
  }

  async findDistinctStudentNames(query?: string): Promise<string[]> {
    const col = await this.collection()
    const pipeline: Record<string, unknown>[] = []

    if (query && query.trim() !== "") {
      pipeline.push({
        $match: {
          studentName: { $regex: escapeRegex(query), $options: "i" },
        },
      })
    }

    pipeline.push({ $group: { _id: "$studentName" } })
    pipeline.push({ $sort: { _id: 1 } })

    const docs = await col.aggregate<{ _id: string }>(pipeline).toArray()

    return docs.map((d) => d._id)
  }

  async aggregateSummary(): Promise<AbsenceSummaryRow[]> {
    const col = await this.collection()
    const docs = await col
      .aggregate<AbsenceSummaryRow>(
        [
          {
            $group: {
              _id: { key: { $toLower: "$studentName" } },
              studentName: { $first: "$studentName" },
              totalAbsences: {
                $sum: {
                  $cond: [{ $eq: ["$type", "absence"] }, 1, 0],
                },
              },
              totalRecoveries: {
                $sum: {
                  $cond: [{ $eq: ["$type", "recovery"] }, 1, 0],
                },
              },
              lastAbsenceDate: {
                $max: {
                  $cond: [{ $eq: ["$type", "absence"] }, "$date", null],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              studentName: 1,
              totalAbsences: 1,
              totalRecoveries: 1,
              pending: { $subtract: ["$totalAbsences", "$totalRecoveries"] },
              lastAbsenceDate: { $ifNull: ["$lastAbsenceDate", null] },
            },
          },
          { $sort: { studentName: 1 } },
        ],
        { collation: { locale: "en", strength: 2 } }
      )
      .toArray()

    return docs
  }
}
