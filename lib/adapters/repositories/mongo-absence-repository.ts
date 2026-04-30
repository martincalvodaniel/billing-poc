import { ObjectId } from "mongodb"
import type { Absence, AbsenceSummaryRow } from "../../domain/entities/absence"
import type {
  AbsenceFilter,
  AbsenceRepository,
} from "../../domain/ports/absence-repository"
import { getDatabase } from "../../mongodb"
import type { Absence as MongoAbsence } from "../../types"

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
  private indexesReady?: Promise<void>

  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoAbsence>("absences")
  }

  private async ensureIndexes(): Promise<void> {
    if (!this.indexesReady) {
      this.indexesReady = (async () => {
        const db = await getDatabase()
        const col = db.collection<MongoAbsence>("absences")
        const specs: Array<{
          keys: Record<string, 1 | -1>
          options?: Record<string, unknown>
        }> = [
          {
            keys: {
              studentNameLower: 1,
              date: 1,
              partOfDay: 1,
            },
            options: { unique: true, name: "uniq_student_date_part" },
          },
          { keys: { date: 1 } },
          { keys: { studentName: 1 } },
          { keys: { type: 1 } },
        ]
        for (const spec of specs) {
          try {
            await col.createIndex(spec.keys, spec.options)
          } catch (err) {
            console.error(
              `MongoAbsenceRepository.ensureIndexes: failed to create index ${JSON.stringify(spec.keys)}: ${err}`
            )
          }
        }
      })()
    }
    return this.indexesReady
  }

  async findAll(filter: AbsenceFilter): Promise<Absence[]> {
    await this.ensureIndexes()
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
      query.studentName = {
        $regex: escapeRegex(filter.studentName),
        $options: "i",
      }
    }

    const docs = await col
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray()

    return docs.map(toDomain)
  }

  async findById(id: string): Promise<Absence | null> {
    if (!isValidObjectId(id)) return null
    await this.ensureIndexes()
    const col = await this.collection()
    const doc = await col.findOne({ _id: toObjectId(id) })
    return doc ? toDomain(doc) : null
  }

  async create(absence: Omit<Absence, "_id">): Promise<string> {
    await this.ensureIndexes()
    const col = await this.collection()
    const now = new Date()
    // Preserve historical doc shape: empty/undefined comment is omitted from
    // the inserted document (matches optional `comment?: string` entity).
    const hasComment = absence.comment !== undefined && absence.comment !== ""
    const doc: Omit<MongoAbsence, "_id"> = {
      type: absence.type,
      studentName: absence.studentName,
      studentNameLower: absence.studentName.trim().toLowerCase(),
      date: absence.date,
      partOfDay: absence.partOfDay,
      ...(hasComment ? { comment: absence.comment } : {}),
      createdAt: absence.createdAt ?? now,
      updatedAt: absence.updatedAt ?? now,
    }
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
    await this.ensureIndexes()
    const col = await this.collection()
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }
    const unsetData: Record<string, ""> = {}

    if (data.type !== undefined) updateData.type = data.type
    if (data.studentName !== undefined) {
      updateData.studentName = data.studentName
      updateData.studentNameLower = data.studentName.trim().toLowerCase()
    }
    if (data.date !== undefined) updateData.date = data.date
    if (data.partOfDay !== undefined) updateData.partOfDay = data.partOfDay
    // Treat empty string as a request to clear the comment: $unset removes
    // the field so the stored doc matches the optional `comment?: string`
    // entity shape.
    if (data.comment !== undefined) {
      if (data.comment === "") {
        unsetData.comment = ""
      } else {
        updateData.comment = data.comment
      }
    }

    const updateOps: Record<string, unknown> = { $set: updateData }
    if (Object.keys(unsetData).length > 0) {
      updateOps.$unset = unsetData
    }

    try {
      const result = await col.updateOne({ _id: toObjectId(id) }, updateOps)
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
    await this.ensureIndexes()
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
  }

  async deleteByStudentName(name: string): Promise<number> {
    await this.ensureIndexes()
    const col = await this.collection()
    const result = await col.deleteMany({
      studentNameLower: name.trim().toLowerCase(),
    })
    return result.deletedCount ?? 0
  }

  async findDistinctStudentNames(query?: string): Promise<string[]> {
    await this.ensureIndexes()
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
    await this.ensureIndexes()
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
