import { loadData } from "./utils";

/**
 * Load data for all months in a given year
 */
async function loadDataForYear(
  year: number,
  baseUrl: string
): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Loading data for all months in ${year}`);
  console.log(`${"=".repeat(60)}\n`);

  let totalInserted = 0;

  for (let month = 1; month <= 12; month++) {
    try {
      await loadData(year, month, baseUrl);
      totalInserted++;
      console.log("\n");
    } catch (error) {
      console.error(
        `\n✗ Error loading data for ${year}-${String(month).padStart(2, "0")}: ${error}`
      );
    }
  }

  console.log(`${"=".repeat(60)}`);
  console.log(`✓ Successfully loaded data for ${totalInserted} months in ${year}`);
  console.log(`${"=".repeat(60)}`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(
      "Usage: npx ts-node scripts/payments/loadRandomDataForYear.ts <year> [baseUrl]"
    );
    console.error(
      "Example: npx ts-node scripts/payments/loadRandomDataForYear.ts 2024 http://localhost:3000"
    );
    process.exit(1);
  }

  const year = parseInt(args[0], 10);
  const baseUrl = args[1] || "http://localhost:3000";

  if (isNaN(year) || year < 1900 || year > 2100) {
    console.error("Invalid year. Please provide a valid year (e.g., 2024).");
    process.exit(1);
  }

  try {
    await loadDataForYear(year, baseUrl);
  } catch (error) {
    console.error("Error loading data:", error);
    process.exit(1);
  }
}

main();
