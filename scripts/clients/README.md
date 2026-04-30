# Client Loading Scripts

This directory contains scripts for loading sample client data into the billing POC application.

## Scripts

### `loadSampleClients.ts`

Loads sample client data (individuals and companies) into the database via the API.

**Usage:**

```bash
# Load 10 sample clients (default)
npx ts-node scripts/clients/loadSampleClients.ts

# Load 20 sample clients
npx ts-node scripts/clients/loadSampleClients.ts 20

# Load 15 sample clients to a custom API endpoint
npx ts-node scripts/clients/loadSampleClients.ts 15 http://localhost:3000
```

**Arguments:**

- `count` (optional): Number of clients to generate (default: 10, max: 1000)
- `baseUrl` (optional): Base URL for the API (default: http://localhost:3000)

**Output:**

- Generates a mix of individual clients (persons/freelancers) and company clients
- Each client has realistic Spanish names, tax IDs (NIF/CIF format), and addresses
- Progress bar shows insertion status
- Sample data displayed after successful load

**Sample Generated Data:**

- **Individuals**: Full name, NIF (8 digits + letter), address in Spanish format
- **Companies**: Business name, CIF (letter + 7 digits + letter), address in Spanish format
- Addresses include street, number, postal code, and city

## Examples

Load 10 clients to localhost:

```bash
npx ts-node scripts/clients/loadSampleClients.ts
```

Load 50 clients:

```bash
npx ts-node scripts/clients/loadSampleClients.ts 50
```

Load 5 clients to production API:

```bash
npx ts-node scripts/clients/loadSampleClients.ts 5 https://billing-app.vercel.app
```

## Utilities

The `utils.ts` file provides utility functions for generating and loading client data:

- `generateIndividualClient()` - Generate a random individual client
- `generateCompanyClient()` - Generate a random company client
- `generateClients(count)` - Generate multiple clients
- `insertClient(baseUrl, client)` - Insert a single client via API
- `loadClients(count, baseUrl)` - Load multiple clients via API with progress reporting
