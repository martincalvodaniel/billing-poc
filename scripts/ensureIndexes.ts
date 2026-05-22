import { ensureIndexes } from "../lib/adapters/repositories/ensure-indexes"
import { getDatabase } from "../lib/mongodb"

async function main(): Promise<void> {
  const db = await getDatabase()
  await ensureIndexes(db)
  console.log("Indexes ensured.")
  process.exit(0)
}

main().catch((err) => {
  console.error(`ensureIndexes script failed: ${err}`)
  process.exit(1)
})
