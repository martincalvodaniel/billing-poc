import { getDatabase } from "@/lib/db/client"
import { ensureIndexes } from "@/lib/db/repositories/ensure-indexes"

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
