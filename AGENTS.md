# Billing POC — Agent Guidelines

## Stack
Next.js 16 (App Router), React 19, TypeScript 6 (strict), MongoDB 7, Tailwind CSS 4, Zod 4 (validation), SWR 2 (client data fetching), Biome (lint + format), Bun (runtime, package manager, test runner).

## Architecture — Hexagonal (Ports & Adapters)
```
lib/constants.ts              → Shared CHART_COLORS
lib/formatters.ts             → Shared formatCurrency, formatDate, formatMonthYear
lib/validation.ts             → Shared zodError() helper
middleware.ts                 → Route protection: redirects unauthenticated users to /auth/signin
src/app/(auth)/auth/signin/   → Custom sign-in page + server action
src/app/api/                  → Thin route handlers: parse → validate → delegate → respond
src/app/api/auth/             → NextAuth API handler (do NOT add auth checks here)
src/components/               → Shared UI (Toast, Modal, DonutChart, PageLayout, etc.)
src/features/<feature>/hooks/ → SWR hooks (usePayments, useClients, useTags, *Mutations)
src/lib/auth/auth.ts          → NextAuth config (Google provider, JWT, email allowlist)
src/lib/auth/require-auth.ts  → requireAuth() guard for API routes
src/lib/client/swr-fetcher.ts → Shared SWR fetcher + FetchError + retry guard
src/lib/db/                   → Infrastructure (MongoPaymentRepository, MongoClientRepository, etc.)
src/lib/domain/entities/      → Pure TS types (Payment, Client, InvoiceCounter)
src/lib/domain/ports/         → Interfaces (PaymentRepository, ClientRepository, etc.)
src/lib/domain/services/      → Business logic (calculators, Zod validators, auth)
```

## Authentication
- **NextAuth.js v5** with Google OAuth provider, JWT sessions (stateless)
- Email allowlist via `ALLOWED_EMAILS` env var (`src/lib/domain/services/auth.ts`)
- Middleware (`src/proxy.ts`) protects all routes except `/auth/*` and `/api/auth/*`
- All API routes call `requireAuth()` from `src/lib/auth/require-auth.ts` as first line in `try` block
- `trustHost: true` in auth config — auto-detects host from request headers
- For ngrok/remote testing: set `AUTH_URL` env var to the ngrok HTTPS URL
- Sign-in uses server action (`src/app/(auth)/auth/signin/actions.ts`), not client-side `signIn()`
- `SessionProvider` wraps app via `src/components/shared/Providers.tsx`; `SWRConfig` is mounted inside `SessionProvider` in the same file

## Universal Rules
- TypeScript strict mode everywhere; no `any` without `unknown` guard
- Domain entities in `src/lib/domain/entities/`; Mongo persistence shapes
  (`Mongo*`, derived from the entities via `Omit`) live in `src/lib/db/types.ts`
  and are imported only by repository adapters in `src/lib/db/repositories/`
- Shared formatting via `lib/formatters.ts`; shared colors via `lib/constants.ts`
- Tailwind CSS only for styling — no CSS modules, no external UI kits
- All pages must use the `PageLayout` component (`src/components/shared/PageLayout.tsx`)
- Console logging: template literals only (`console.error(\`Error: ${error}\`)`)
- Dark mode: use `dark:` classes on all visual elements
- Currency: EUR with `es-ES` via `Intl.NumberFormat`; dates: `en-US` via `toLocaleDateString`

## Client-Side Data Fetching (SWR)
- **Never call `fetch` directly from a client component or `useEffect`.** Use SWR hooks from `src/features/<feature>/hooks/` (or add a new one there).
- **GETs** → `useSWR` via a hook that exposes `buildXKey`, `buildXUrl`, `isXKey`, and `useX(args)` (e.g., `usePayments`, `useClients`, `useTags`). Keys MUST be stable tuples of primitives — never inline objects.
- **POST/PUT/DELETE** → `useSWRMutation` via `useXMutation` hooks (e.g., `useCreatePayment`). Each mutation hook invalidates its resource cache via `mutate(isXKey, undefined, { revalidate: true })` from `useSWRConfig` on success — call sites MUST NOT add manual `mutate()` bridges.
- **Multipart uploads**: do NOT set `Content-Type` manually; let the browser add the boundary.
- **Errors**: throw `FetchError` (from `src/lib/client/swr-fetcher.ts`); 401/403/404 must NOT trigger SWR retries (`shouldRetryOnError` already handles this globally in `src/components/shared/Providers.tsx`).
- **Forbidden patterns**: `useEffect` + `fetch` for data, `AbortController` for component fetches, `window.focus`/`visibilitychange` listeners that re-fetch, `useImperativeHandle` exposing `refresh*` methods. To revalidate from a parent, call `useSWRConfig().mutate(isXKey)`.
- **SWR global config** (in `src/components/shared/Providers.tsx`): `revalidateOnFocus: false`, `dedupingInterval: 2000`, `keepPreviousData: true`. Do not override per-hook unless justified.
- **Tests**: each hook exports pure helpers (`buildXKey`, `buildXUrl`, `isXKey`, request builders) covered by `bun:test` unit tests under `src/features/<feature>/hooks/*.test.ts`. Avoid React-render tests for hooks.

## Commands
| Command                           | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `bun install`                     | Install dependencies                 |
| `bun dev`                         | Start dev server                     |
| `bun run build`                   | Production build                     |
| `bun run lint`                    | Biome check (lint + format)          |
| `bun run lint:fix`                | Auto-fix lint/format issues          |
| `bun test`                        | Run unit tests                       |
| `bun run load-data:month YYYY MM` | Load sample payment data for a month |
| `bun run load-data:year YYYY`     | Load sample data for all 12 months   |

## Quality Checklist
- Domain logic goes in `src/lib/domain/services/`, never in API routes or components
- API routes use repository adapters + Zod schemas, never raw MongoDB queries
- Validation via Zod schemas (`src/schemas/*-validator.ts`)
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
- 
## Dynamic Context Enhancement
- Before planning or making changes under the `src/app/` directory, always read `src/app/AGENTS.md`.
- Before planning or making changes under the `src/app/api` directory, always read `src/app/api/AGENTS.md`.
- Before planning or making changes under the `src/lib/db/repositories/` directory, always read `src/lib/db/repositories/AGENTS.md`.
- Before planning or making changes under the `src/app/(dashboard)/month/` directory, always read `src/app/(dashboard)/month/AGENTS.md`.
- If an `AGENTS.md` file exists in the parent directory of any modified file, explicitly load it into context.

