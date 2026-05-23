# Absence Sample Data

Loads random absence/recovery records into the running app via `POST /api/absences`.

## Usage

```bash
# Current year/month, default URL (http://localhost:3000)
bun run load-data:absences

# Specific year/month
bun run load-data:absences 2026 4

# Custom server / count
bun run load-data:absences 2026 4 --baseUrl=http://localhost:3000 --count=30
```

## What it generates

- 15–25 records (override with `--count=<n>`)
- ~60% `type: "absence"`, ~40% `type: "recovery"`
- Random date inside the requested month
- `studentName` from a fixed pool of ~12 fictitious Spanish names

## Arguments

| Arg          | Type   | Default               | Description                |
| ------------ | ------ | --------------------- | -------------------------- |
| year         | number | current year          | Target year                |
| month        | number | current month (1-12)  | Target month               |
| `--baseUrl=` | string | `http://localhost:3000` | API base URL              |
| `--count=`   | number | 15–25 (random)        | Number of records to post  |

## Auth note

Mirrors `scripts/payments/loadRandomDataForMonth.ts`: the script issues plain
`fetch` POSTs without cookies, so the target API must accept the request. In
the current codebase `/api/absences` is guarded by `requireAuth()`, so this
script is intended for environments where auth is bypassed (e.g. running
against a server with `AUTH_BYPASS` enabled or a session cookie injected
manually). Without that, every request returns 401 and the script reports
errors.

Exits `0` on full success, `1` on any error.
