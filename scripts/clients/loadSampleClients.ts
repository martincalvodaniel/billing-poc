import { loadClients } from "./utils"

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)

  // Default to loading 10 clients
  let count = 10
  let baseUrl = "http://localhost:3000"

  // Parse arguments
  if (args.length > 0 && !Number.isNaN(parseInt(args[0], 10))) {
    count = parseInt(args[0], 10)
  }

  if (args.length > 1) {
    baseUrl = args[1]
  }

  if (count < 1 || count > 1000) {
    console.error("Count must be between 1 and 1000.")
    process.exit(1)
  }

  try {
    await loadClients(count, baseUrl)
    console.log("\n✓ Clients loaded successfully!\n")
  } catch (error) {
    console.error("\nError loading clients:", error)
    process.exit(1)
  }
}

main()
