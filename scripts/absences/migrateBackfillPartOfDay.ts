/**
 * One-shot idempotent migration: backfills `partOfDay` and `studentNameLower`
 * on every legacy absence document where either field is missing.
 *
 * IMPORTANT: This script MUST be run BEFORE the unique index in
 * `MongoAbsenceRepository.ensureIndexes()` (key:
 * `{ studentNameLower: 1, date: 1, partOfDay: 1, type: 1 }`) takes effect
 * against production data. Without backfill, legacy docs would all collide
 * on `studentNameLower: null` + `partOfDay: null` and the unique index
 * build would fail.
 *
 * Idempotent: re-running after a successful pass reports 0 modified docs.
 *
 * Usage:
 *   bun run migrate:absences:partOfDay              # apply changes
 *   bun run migrate:absences:partOfDay -- --dry-run # report counts only
 */

import { getDatabase } from "../../lib/mongodb"

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes("--dry-run")

  const db = await getDatabase()
  const absences = db.collection("absences")

  const missingPartOfDayCount = await absences.countDocuments({
    partOfDay: { $exists: false },
  })
  const missingStudentNameLowerCount = await absences.countDocuments({
    studentNameLower: { $exists: false },
  })

  console.log(
    `Scan: ${missingPartOfDayCount} doc(s) missing partOfDay, ${missingStudentNameLowerCount} doc(s) missing studentNameLower`
  )

  if (dryRun) {
    console.log("Dry run — no writes performed.")
    return
  }

  const partOfDayResult = await absences.updateMany(
    { partOfDay: { $exists: false } },
    { $set: { partOfDay: "morning" } }
  )

  const studentNameLowerResult = await absences.updateMany(
    { studentNameLower: { $exists: false } },
    [
      {
        $set: {
          studentNameLower: {
            $toLower: { $trim: { input: "$studentName" } },
          },
        },
      },
    ]
  )

  console.log(
    `Result: ${JSON.stringify({
      partOfDayBackfilled: partOfDayResult.modifiedCount,
      studentNameLowerBackfilled: studentNameLowerResult.modifiedCount,
    })}`
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`migrateBackfillPartOfDay failed: ${error}`)
    process.exit(1)
  })
