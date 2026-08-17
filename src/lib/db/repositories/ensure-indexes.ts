import type { CreateIndexesOptions, Db, IndexSpecification } from "mongodb"

export interface IndexSpec {
  collection: string
  keys: IndexSpecification
  options?: CreateIndexesOptions
}

export const INDEX_SPECS: IndexSpec[] = [
  {
    collection: "payments",
    keys: { date: -1, createdAt: -1 },
    options: { name: "date_desc_createdAt_desc" },
  },
  {
    collection: "payments",
    keys: { type: 1, tag: 1 },
    options: { name: "type_asc_tag_asc" },
  },
  {
    collection: "clients",
    keys: { name: 1 },
    options: { name: "name_asc" },
  },
  {
    collection: "products",
    keys: { name: 1 },
    options: { name: "name_asc" },
  },
  {
    collection: "products",
    keys: { tag: 1 },
    options: { name: "tag_asc" },
  },
  {
    collection: "paymentTemplates",
    keys: { name: 1 },
    options: { name: "name_asc" },
  },
  {
    collection: "absences",
    keys: { studentNameLower: 1, date: 1, partOfDay: 1 },
    options: { name: "uniq_student_date_part", unique: true },
  },
  {
    collection: "absences",
    keys: { date: -1, createdAt: -1 },
    options: { name: "date_desc_createdAt_desc" },
  },
  {
    collection: "events",
    keys: { date: -1, createdAt: -1 },
    options: { name: "date_desc_createdAt_desc" },
  },
  {
    collection: "invoiceCounters",
    keys: { series: 1, year: 1 },
    options: { name: "uniq_series_year", unique: true },
  },
]

export async function ensureIndexes(
  db: Db,
  specs: IndexSpec[] = INDEX_SPECS
): Promise<void> {
  for (const spec of specs) {
    try {
      await db.collection(spec.collection).createIndex(spec.keys, spec.options)
    } catch (err) {
      console.error(
        `ensureIndexes: failed to create ${spec.collection}.${spec.options?.name ?? JSON.stringify(spec.keys)}: ${err}`
      )
    }
  }
}
