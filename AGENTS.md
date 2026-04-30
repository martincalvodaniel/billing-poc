# Billing POC — Agent Guidelines

## Stack
Next.js 16 (App Router), React 19, TypeScript 6 (strict), MongoDB 7, Tailwind CSS 4, Zod 4 (validation), Biome (lint + format), Bun (runtime, package manager, test runner).

## Architecture — Hexagonal (Ports & Adapters)
```
lib/domain/entities/     → Pure TS types (Payment, Client, InvoiceCounter)
lib/domain/services/     → Business logic (calculators, Zod validators, auth)
lib/domain/ports/        → Interfaces (PaymentRepository, ClientRepository, etc.)
lib/adapters/            → Infrastructure (MongoPaymentRepository, VercelBlobStorage, etc.)
lib/auth.ts              → NextAuth config (Google provider, JWT, email allowlist)
lib/api-auth.ts          → requireAuth() guard for API routes
lib/formatters.ts        → Shared formatCurrency, formatDate, formatMonthYear
lib/constants.ts         → Shared CHART_COLORS
lib/validation.ts        → Shared zodError() helper
app/api/                 → Thin route handlers: parse → validate → delegate → respond
app/api/auth/            → NextAuth API handler (do NOT add auth checks here)
app/auth/signin/         → Custom sign-in page + server action
app/components/          → Shared UI (Toast, Modal, DonutChart, PageLayout, etc.)
middleware.ts            → Route protection: redirects unauthenticated users to /auth/signin
```

## Authentication
- **NextAuth.js v5** with Google OAuth provider, JWT sessions (stateless)
- Email allowlist via `ALLOWED_EMAILS` env var (`lib/domain/services/auth.ts`)
- Middleware (`middleware.ts`) protects all routes except `/auth/*` and `/api/auth/*`
- All API routes call `requireAuth()` from `lib/api-auth.ts` as first line in `try` block
- `trustHost: true` in auth config — auto-detects host from request headers
- For ngrok/remote testing: set `AUTH_URL` env var to the ngrok HTTPS URL
- Sign-in uses server action (`app/auth/signin/actions.ts`), not client-side `signIn()`
- `SessionProvider` wraps app via `app/components/Providers.tsx`

## Universal Rules
- TypeScript strict mode everywhere; no `any` without `unknown` guard
- Domain entities in `lib/domain/entities/`; MongoDB types in `lib/types.ts`
- Shared formatting via `lib/formatters.ts`; shared colors via `lib/constants.ts`
- Tailwind CSS only for styling — no CSS modules, no external UI kits
- All pages must use the `PageLayout` component (`app/components/PageLayout.tsx`)
- Console logging: template literals only (`console.error(\`Error: ${error}\`)`)
- Dark mode: use `dark:` classes on all visual elements
- Currency: EUR with `es-ES` via `Intl.NumberFormat`; dates: `en-US` via `toLocaleDateString`

## Commands
| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun dev` | Start dev server |
| `bun run build` | Production build |
| `bun run lint` | Biome check (lint + format) |
| `bun run lint:fix` | Auto-fix lint/format issues |
| `bun test` | Run unit tests |
| `bun run load-data:month YYYY MM` | Load sample payment data for a month |
| `bun run load-data:year YYYY` | Load sample data for all 12 months |

## Quality Checklist
- Domain logic goes in `lib/domain/services/`, never in API routes or components
- API routes use repository adapters + Zod schemas, never raw MongoDB queries
- Validation via Zod schemas (`lib/domain/services/*-validator.ts`)
- Linting passes (`bun run lint`)
- Tests pass (`bun test`)
- Build passes (`bun run build`)
- Icon-only buttons have `aria-label`
- Modals have `role="dialog"`, `aria-labelledby`, `aria-modal`
- Focus indicators on all interactive elements

## Debugging
- API issues: browser Network tab + console logs
- MongoDB: verify URI and container (`docker start mongodb`)
- Types: `bunx tsc --noEmit`
- Build: clear `.next/` then `bun run build`
