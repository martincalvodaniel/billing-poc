import { loadData as loadDataUtil } from "./utils"

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error(
      "Usage: npx ts-node scripts/payments/loadRandomDataForMonth.ts <year> <month> [baseUrl]"
    )
    console.error(
      "Example: npx ts-node scripts/payments/loadRandomDataForMonth.ts 2024 1 http://localhost:3000"
    )
    process.exit(1)
  }

  const year = parseInt(args[0], 10)
  const month = parseInt(args[1], 10)
  const baseUrl = args[2] || "http://localhost:3000"

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    console.error("Invalid year or month. Month must be between 1 and 12.")
    process.exit(1)
  }

  try {
    await loadDataUtil(year, month, baseUrl)
  } catch (error) {
    console.error("Error loading data:", error)
    process.exit(1)
  }
}

main()
