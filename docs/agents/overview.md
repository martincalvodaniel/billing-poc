# Billing POC Overview

**Purpose**: Proof-of-concept billing system with Next.js 16, React 19, TypeScript, and MongoDB. Manages income/outcome payments with real-time visualization.

## Characteristics
- Full TypeScript strict mode
- Next.js App Router with server-side rendering
- MongoDB with type-safe collections
- Tailwind CSS 4, no external UI kits
- Accessibility: WCAG 2.1 Level A with ARIA/live regions
- Native dark mode via color-scheme meta
- **Unified Design System**: All pages follow consistent layout, colors, spacing, navigation, and component styling for cohesive user experience

## Architecture
- app/: Next.js App Router
  - api/payments/route.ts: REST API
  - components/ (shared): DonutChart, PaymentCounter, NavigationBar, SummaryCard
  - month/: Monthly payments page
    - components/ (month-specific): PaymentForm, MonthlyPaymentsView, MonthSelector
    - page.tsx: Monthly payments list with month navigation
  - year/: Yearly summary page
    - components/ (year-specific): MonthlyBreakdown, YearSelector
    - page.tsx: Yearly summary with year picker
  - page.tsx: Redirect to /month
  - layout.tsx, globals.css
- lib/: mongodb.ts (singleton), types.ts (shared types)
- public/: static assets

## Component Organization
**Shared Components** (`/app/components/`): Multi-use components across pages
- DonutChart: Tag-based breakdown visualization
- PaymentCounter: Payment count by type
- NavigationBar: Top navigation with page links
- SummaryCard: Reusable info card (label + value)

**Page-Specific Components**: Co-located with their pages for clarity
- `/app/month/components/`: PaymentForm (modal), MonthlyPaymentsView (list), MonthSelector (picker)
- `/app/year/components/`: MonthlyBreakdown (breakdown cards), YearSelector (picker)

## Data Flow
1) User input → PaymentForm (client validation)
2) API → app/api/payments/route.ts (server validation)
3) DB → MongoDB collection "payments"
4) Display → MonthlyPaymentsView (fetch, filter by month, summaries)
5) Visualization → DonutChart (tag-based breakdown); MonthlyBreakdown (monthly totals)

## Design System (All Pages)
All pages must follow consistent design patterns to ensure a cohesive user experience:
- **Layout**: Main container with `mx-auto max-w-6xl space-y-8 py-12`
- **Navigation**: Consistent nav bar on every page with active/inactive link states
- **Headers**: 4xl bold title + lg subtitle with matching dark mode
- **Cards**: Zinc borders, white backgrounds, shadow-sm, rounded-lg
- **Colors**: Zinc base palette + blue accents (primary), green (income), red (outcome)
- **Spacing**: `space-y-6` for content sections, consistent padding patterns
- **Dark Mode**: Full support with `dark:` classes on all elements

See [patterns-ui.md](./patterns-ui.md) → Page Layout & Design System and [conventions.md](./conventions.md) → Styling & Design System Consistency for detailed specifications.
