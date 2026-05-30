import type { CompanyInfo } from "../../domain/entities/companyInfo"
import type { CompanyInfoRepository } from "../../domain/ports/company-info-repository"
import { getDatabase } from "../../mongodb"

const STRING_FIELDS: ReadonlyArray<keyof CompanyInfo> = [
  "name",
  "taxId",
  "addressLine",
  "postalCode",
  "city",
  "country",
  "phone",
  "email",
  "logoUrl",
]

function toPartial(doc: unknown): Partial<CompanyInfo> {
  if (!doc || typeof doc !== "object") return {}
  const record = doc as Record<string, unknown>
  const result: Partial<CompanyInfo> = {}
  for (const key of STRING_FIELDS) {
    const value = record[key]
    if (typeof value === "string") {
      result[key] = value
    }
  }
  return result
}

export class MongoCompanyInfoRepository implements CompanyInfoRepository {
  async findOne(): Promise<Partial<CompanyInfo> | null> {
    const db = await getDatabase()
    const doc = await db.collection("companyInfo").findOne({})
    if (!doc) return null
    return toPartial(doc)
  }
}
