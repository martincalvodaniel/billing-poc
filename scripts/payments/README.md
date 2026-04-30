# Data Loading Scripts

This directory contains utilities for loading payment data into the billing application.

For **client data loading**, see [`../clients/README.md`](../clients/README.md).

## Payment Scripts

### loadRandomDataForMonth.ts

Generates and loads random payment data for a specified year and month via the application API.

### Overview

This script creates realistic test data with:
- **5-10 Income payments** with random dates, amounts, and tags
- **5-10 Outcome payments** with random dates, amounts, and tags
- **1-5 Concepts per payment** with:
  - Optional custom names (70% probability)
  - Random amounts (100-5000)
  - Optional concept-level VAT overrides
- **Realistic VAT percentages** (0, 10, 21%)
- **Automatic calculations** for net amounts and VAT

### Usage

#### Basic Usage (localhost:3000)
```bash
bun run scripts/payments/loadRandomDataForMonth.ts 2025 1
```

#### With Custom Base URL
```bash
bun run scripts/payments/loadRandomDataForMonth.ts 2025 1 http://localhost:3000
```

#### With Remote URL
```bash
bun run scripts/payments/loadRandomDataForMonth.ts 2025 1 https://billing-poc.example.com
```

### Examples

Load data for January 2024:
```bash
bun run scripts/payments/loadRandomDataForMonth.ts 2024 1
```

Load data for March 2025 with custom server:
```bash
bun run scripts/payments/loadRandomDataForMonth.ts 2025 3 http://192.168.1.100:3000
```

Load data for December 2023:
```bash
bun run scripts/payments/loadRandomDataForMonth.ts 2023 12
```

### Script Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| year | number | Yes | The year for the payment date (e.g., 2024) |
| month | number | Yes | The month for the payment date (1-12) |
| baseUrl | string | No | API base URL (default: `http://localhost:3000`) |

---

## loadRandomDataForYear.ts

Generates and loads random payment data for all months in a specified year via the application API.

### Overview

This script:
- Iterates through all 12 months of a given year
- Calls `loadRandomDataForMonth` for each month
- Generates 5-10 incomes and 5-10 outcomes per month
- Provides progress tracking with month-by-month reporting
- Summarizes results at the end

### Usage

#### Basic Usage (localhost:3000)
```bash
bun run scripts/payments/loadRandomDataForYear.ts 2025
```

#### With Custom Base URL
```bash
bun run scripts/payments/loadRandomDataForYear.ts 2025 http://localhost:3000
```

#### With Remote URL
```bash
bun run scripts/payments/loadRandomDataForYear.ts 2025 https://billing-poc.example.com
```

### Examples

Load data for entire year 2024:
```bash
bun run scripts/payments/loadRandomDataForYear.ts 2024
```

Load data for 2025 with custom server:
```bash
bun run scripts/payments/loadRandomDataForYear.ts 2025 http://192.168.1.100:3000
```

### Script Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| year | number | Yes | The year for the payment dates (e.g., 2024) |
| baseUrl | string | No | API base URL (default: `http://localhost:3000`) |

### Output

The script displays:
- Overall progress header for the year
- Month-by-month loading progress
- Total successful/failed months at the end
- Each month's individual insert counts and error details

---

## Prerequisites

- Application running on specified base URL
- MongoDB database connected to the application
- Node.js and bun installed

## Data Generation Details

### Income Tags
- Client Invoice
- Consulting Fee
- Software License
- Support Service
- Training Session
- Development Work
- Project Delivery
- Maintenance Fee

### Outcome Tags
- Office Supplies
- Software License
- Cloud Services
- Employee Salary
- Office Rent
- Equipment
- Utilities
- Marketing
- Professional Services
- Travel Expenses

### Concept Names
- Labor
- Materials
- Services
- Hardware
- Software
- Consulting
- Design
- Development
- Testing
- Deployment

## Error Handling

The scripts report:
- Failed insertions with error details
- Invalid arguments with usage information
- Connection errors to the API

All payments are inserted sequentially to ensure proper ordering.

## Shared Utilities

Both scripts use `utils.ts` which contains:
- Data generation functions (income, outcomes, concepts)
- API insertion logic
- VAT and calculation helpers
- Random data generators
