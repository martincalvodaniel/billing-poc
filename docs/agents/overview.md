# Billing POC Overview

**Purpose**: Proof-of-concept billing system with Next.js 16, React 19, TypeScript, and MongoDB. Manages income/outcome payments with real-time visualization.

## Characteristics
- Full TypeScript strict mode
- Next.js App Router with server-side rendering
- MongoDB with type-safe collections
- Tailwind CSS 4, no external UI kits
- Accessibility: WCAG 2.1 Level A with ARIA/live regions
- Native dark mode via color-scheme meta

## Architecture
- app/: Next.js App Router
  - api/payments/route.ts: REST API
  - components/: DonutChart, PaymentForm, PaymentsList
  - page.tsx: Home (monthly list + modal launcher beside calendar controls)
  - year/page.tsx: Year summary
  - layout.tsx, globals.css
- lib/: mongodb.ts (singleton), types.ts (shared types)
- public/: static assets

## Data Flow
1) User input → PaymentForm (client validation)
2) API → app/api/payments/route.ts (server validation)
3) DB → MongoDB collection "payments"
4) Display → PaymentsList (fetch, filter by month, summaries)
5) Visualization → DonutChart (tag-based breakdown)
