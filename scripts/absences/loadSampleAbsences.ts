import { loadAbsenceData, randomBetween } from "./utils"

const DEFAULT_BASE_URL = "http://localhost:3000"

interface ParsedArgs {
  year: number
  month: number
  baseUrl: string
  count: number
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = []
  let baseUrl = DEFAULT_BASE_URL
  let count: number | null = null

  for (const arg of argv) {
    if (arg.startsWith("--baseUrl=")) {
      baseUrl = arg.slice("--baseUrl=".length)
    } else if (arg.startsWith("--count=")) {
      const parsed = Number.parseInt(arg.slice("--count=".length), 10)
      if (Number.isNaN(parsed) || parsed < 1) {
        throw new Error(`Invalid --count value: ${arg}`)
      }
      count = parsed
    } else {
      positional.push(arg)
    }
  }

  const now = new Date()
  const year =
    positional[0] !== undefined
      ? Number.parseInt(positional[0], 10)
      : now.getFullYear()
  const month =
    positional[1] !== undefined
      ? Number.parseInt(positional[1], 10)
      : now.getMonth() + 1

  if (Number.isNaN(year)) {
    throw new Error(`Invalid year: ${positional[0]}`)
  }
  if (Number.isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month: ${positional[1]} (must be 1-12)`)
  }

  return {
    year,
    month,
    baseUrl,
    count: count ?? randomBetween(15, 25),
  }
}

async function main(): Promise<void> {
  let args: ParsedArgs
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    console.error(
      "Usage: bun run scripts/absences/loadSampleAbsences.ts [year] [month] [--baseUrl=<url>] [--count=<n>]"
    )
    console.error(
      "Example: bun run scripts/absences/loadSampleAbsences.ts 2026 4 --baseUrl=http://localhost:3000"
    )
    process.exit(1)
    return
  }

  try {
    const result = await loadAbsenceData(
      args.year,
      args.month,
      args.baseUrl,
      args.count
    )
    console.log(
      `\nDone. inserted=${result.inserted} errors=${result.errors.length} total=${result.total}`
    )
    process.exit(result.errors.length === 0 ? 0 : 1)
  } catch (error) {
    console.error("Error loading absence data:", error)
    process.exit(1)
  }
}

main()
