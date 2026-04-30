# Billing POC — Agent Guidelines

## Stack
Next.js 16 (App Router), React 19, TypeScript 6 (strict), MongoDB 7, Tailwind CSS 4, Biome (lint + format), Bun (runtime, package manager, test runner).

## Universal Rules
- TypeScript strict mode everywhere; no `any` without `unknown` guard
- All shared types in `lib/types.ts`; never duplicate type definitions
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
- Types imported from `lib/types.ts`
- API endpoints validate inputs, return `NextResponse.json` with correct status
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
