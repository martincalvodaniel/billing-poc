import { ObjectId } from "mongodb"
import type { Absence, AbsenceSummaryRow } from "../../domain/entities/absence"
import type {
  AbsenceFilter,
  AbsenceRepository,
} from "../../domain/ports/absence-repository"
import { getDatabase } from "../../mongodb"
import type { Absence as MongoAbsence } from "../../types"

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
    comment: doc.comment,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
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
    const col = await this.collection()
    const doc = await col.findOne({ _id: toObjectId(id) })
    return doc ? toDomain(doc) : null
  }

  async create(absence: Omit<Absence, "_id">): Promise<string> {
    const col = await this.collection()
    const now = new Date()
    const doc: Omit<MongoAbsence, "_id"> = {
      type: absence.type,
      studentName: absence.studentName,
      date: absence.date,
      comment: absence.comment,
      createdAt: absence.createdAt ?? now,
      updatedAt: absence.updatedAt ?? now,
    }
    const result = await col.insertOne(doc as MongoAbsence)
    return result.insertedId.toString()
  }

  async update(id: string, data: Partial<Absence>): Promise<boolean> {
    const col = await this.collection()
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (data.type !== undefined) updateData.type = data.type
    if (data.studentName !== undefined)
      updateData.studentName = data.studentName
    if (data.date !== undefined) updateData.date = data.date
    if (data.comment !== undefined) updateData.comment = data.comment

    const result = await col.updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    )
    return result.modifiedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
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
