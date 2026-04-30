# Workflow & Ops

## Setup
- bun install
- MongoDB via Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest
- bun dev to start app

## Build & Lint
- bun run build
- bun run lint (runs Biome check)
- bun run lint:fix (auto-fix lint issues)
- bun run format (auto-format with Biome)

## Testing
- bun test (run all unit tests)
- bun test --watch (watch mode)

## Data Loading Scripts

Load realistic test payment data for development and testing:

### Load Data for a Specific Month
```bash
bun run load-data:month <year> <month> [baseUrl]
```

**Examples:**
```bash
bun run load-data:month 2024 1                    # January 2024 (localhost:3000)
bun run load-data:month 2025 3 http://localhost:3000
bun run load-data:month 2024 12 https://your-domain.com
```

Generates 5-10 random incomes and 5-10 random outcomes for the specified month. Each payment has 1-5 concepts with optional names and VAT overrides. See [scripts/payments/README.md](../../scripts/payments/README.md) for detailed documentation.

### Load Data for an Entire Year
```bash
bun run load-data:year <year> [baseUrl]
```

**Examples:**
```bash
bun run load-data:year 2024                      # All months in 2024 (localhost:3000)
bun run load-data:year 2025 http://localhost:3000
bun run load-data:year 2023 https://your-domain.com
```

Iterates through all 12 months and loads data for each using the month loader. Provides progress tracking and a summary at completion.

### Data Format
- **Amounts**: Random 100-5000 per concept
- **VAT percentages**: 0%, 10%, or 21%
- **Concept-level VAT**: 70% of concepts have optional VAT overrides
- **Tags**: Realistic income/outcome categories
- **Dates**: Distributed throughout the specified month(s)

For complete documentation including all data characteristics, see [scripts/payments/README.md](../../scripts/payments/README.md).

## Useful Commands
- docker stop mongodb; docker start mongodb
- MongoDB Compass URI: mongodb://localhost:27017/billing-poc
- Load month data: bun run load-data:month 2024 1
- Load year data: bun run load-data:year 2024

## Debugging
- API issues: browser Network tab + console logs
- Mongo issues: verify URI, DB running
- Types: bunx tsc --noEmit
- Builds: clear .next then bun run build
- Data loading: check script output for insert progress and any errors

## File Access Guidelines
- Types: check lib/types.ts first
- Styles: Tailwind in components (globals.css only global)
- Components: keep focused and semantic
- API: follow app/api/payments/route.ts patterns
- Scripts: see scripts/payments/ for data loading utilities (utils.ts has shared functions)
