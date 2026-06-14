import type {
  AbsenceFormData,
  AbsenceType,
  PartOfDay,
} from "@/lib/domain/entities/absence"

const STUDENT_NAMES = [
  "María García",
  "Juan Pérez",
  "Lucía Martínez",
  "Carlos Rodríguez",
  "Sofía López",
  "Diego Fernández",
  "Elena Sánchez",
  "Pablo Gómez",
  "Carmen Ruiz",
  "Javier Moreno",
  "Isabel Jiménez",
  "Andrés Navarro",
]

/**
 * Random integer in [min, max] inclusive.
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Number of days in the given month (month is 1-12).
 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Generate a random YYYY-MM-DD date within the given month.
 */
function generateDateInMonth(year: number, month: number): string {
  const day = randomBetween(1, daysInMonth(year, month))
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/**
 * Pick a random element from an array.
 */
function randomPick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

interface GenerateAbsenceRecordsArgs {
  year: number
  month: number
  count: number
}

/**
 * Generate `count` random absence records for the given month.
 *
 * Distribution:
 * - ~60% absence / ~40% recovery
 */
function generateAbsenceRecords({
  year,
  month,
  count,
}: GenerateAbsenceRecordsArgs): AbsenceFormData[] {
  const records: AbsenceFormData[] = []
  const seen = new Set<string>()
  const MAX_RETRIES = 5

  for (let i = 0; i < count; i++) {
    let studentName = randomPick(STUDENT_NAMES)
    let date = generateDateInMonth(year, month)
    let partOfDay: PartOfDay = Math.random() < 0.5 ? "morning" : "evening"
    let key = `${studentName}|${date}|${partOfDay}`
    let attempts = 0

    while (seen.has(key) && attempts < MAX_RETRIES) {
      studentName = randomPick(STUDENT_NAMES)
      date = generateDateInMonth(year, month)
      partOfDay = Math.random() < 0.5 ? "morning" : "evening"
      key = `${studentName}|${date}|${partOfDay}`
      attempts++
    }

    if (seen.has(key)) {
      continue
    }
    seen.add(key)

    const type: AbsenceType = Math.random() < 0.6 ? "absence" : "recovery"
    const record: AbsenceFormData = {
      type,
      studentName,
      date,
      partOfDay,
    }
    records.push(record)
  }
  return records
}

/**
 * POST a single absence record to the API.
 */
async function insertAbsence(
  baseUrl: string,
  record: AbsenceFormData
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/absences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
  })

  if (!response.ok) {
    let detail = ""
    try {
      const body = (await response.json()) as { error?: string }
      detail = body.error ?? ""
    } catch {
      // ignore parse error
    }
    throw new Error(
      `Failed to insert absence (${response.status}): ${detail || response.statusText}`
    )
  }
}

interface LoadAbsencesResult {
  total: number
  inserted: number
  errors: { index: number; error: string }[]
}

/**
 * Load `count` random absence records for the given month via the API.
 */
export async function loadAbsenceData(
  year: number,
  month: number,
  baseUrl: string,
  count: number
): Promise<LoadAbsencesResult> {
  const records = generateAbsenceRecords({ year, month, count })

  console.log(
    `Loading ${records.length} absence records for ${year}-${String(month).padStart(2, "0")}...`
  )
  console.log(`  - API URL: ${baseUrl}\n`)

  let inserted = 0
  const errors: { index: number; error: string }[] = []

  for (let i = 0; i < records.length; i++) {
    try {
      await insertAbsence(baseUrl, records[i])
      inserted++
      process.stdout.write(`\rInserting... ${inserted}/${records.length}`)
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.log(
    `\n✓ Successfully inserted ${inserted} of ${records.length} absence records`
  )

  if (errors.length > 0) {
    console.log(`\n⚠ ${errors.length} records failed to insert:`)
    for (const { index, error } of errors) {
      console.log(`  - Record ${index}: ${error}`)
    }
  }

  if (records.length > 0) {
    console.log("\nSample record:")
    console.log(JSON.stringify(records[0], null, 2))
  }

  return { total: records.length, inserted, errors }
}
