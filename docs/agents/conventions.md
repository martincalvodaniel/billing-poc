# Code Conventions

## TypeScript
- Strict mode; prefer interfaces for contracts, types for unions/utilities
- Export shared types from lib/types.ts
- Avoid any; use unknown with guards when needed

## React Components
- Functional components with hooks (React 19)
- PascalCase components, camelCase handlers
- Extract reusable logic; use semantic HTML
- Memoize pure components with React.memo()
- Lift state to parent for shared filter state (e.g., selectedDate in page.tsx drives PaymentsList and PaymentForm)

### Component Extraction
Extract components when they appear in multiple places or represent a cohesive UI unit:
- **MonthlyPaymentsView**: Monthly payment list with editing, deletion, and filtering (replaces inline logic)
- **MonthlyBreakdown**: Monthly totals breakdown visualization (extracted from year view)
- **PaymentCounter**: Shows payment count breakdown by type (used in both monthly and yearly views)
- **MonthSelector**: Calendar picker reused across pages
- **YearSelector**: Year navigation reused across pages
- **DonutChart**: Visualization reused for income/outcome tag breakdowns
- Document extracted components in [patterns-ui.md](./patterns-ui.md) with Props, Features, and Integration Notes

## API Routes
- Return NextResponse.json()
- Support GET/POST/PUT; validate all inputs
- Parse numeric strings (parseFloat/parseInt)
- Use correct HTTP status codes

## Console Logging
- Always template literals: console.error(`Error context: ${error}`)
- Avoid comma-separated logging

## Styling & Design System

### Tailwind CSS
- Tailwind-only; mobile-first (sm/md/lg)
- Colors: income green, outcome red, balance blue
- Dark mode supported via color-scheme meta

### Design System Consistency (All Pages)
All pages in the webapp must follow the same design system to ensure a cohesive user experience. This includes:

**Layout & Spacing:**
- Main container: `mx-auto max-w-6xl space-y-8 py-12`
- Content sections: `space-y-6` for vertical spacing
- Grid layouts: `grid gap-4 sm:grid-cols-2` or `sm:grid-cols-3` depending on content

**Navigation Bar (appears on all pages):**
- Consistent styling: `rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- Left section: Billing label with page descriptor (e.g., "Monthly Payments", "Yearly Summary")
- Right section: Navigation links with active/inactive states
  - Active link: `text-blue-700` with `hover:bg-blue-50` background
  - Inactive link: `text-zinc-700` with `hover:bg-zinc-100` background
- Same focus ring and dark mode styling throughout

**Page Headers (all pages):**
- Large heading: `text-4xl font-bold tracking-tight`
- Subtitle: `text-lg text-zinc-600` with matching dark mode
- Center-aligned with `text-center` container

**Content Cards:**
- Borders: `border border-zinc-200 dark:border-zinc-800`
- Backgrounds: `bg-white dark:bg-zinc-900`
- Shadows: `shadow-sm` (subtle)
- Rounding: `rounded-lg`
- Padding: `px-6 py-4` for headers, `px-6 pb-6` for content

**Color Palette:**
- Primary backgrounds: zinc-50 (light), zinc-950 (dark)
- Cards: white/zinc-900
- Borders: zinc-200/800
- Text: zinc-900/50 (light), zinc-100 (dark)
- Accents: blue (600/700), green (income), red (outcome)

**Dark Mode:**
Apply `dark:` classes consistently for all colors, backgrounds, borders, and text

**When adding new pages:**
1. Use the same main container structure and spacing
2. Include the navigation bar with appropriate active state
3. Add page header with title and description
4. Follow card styling and color patterns
5. Ensure dark mode coverage on all interactive elements
6. Use same button styles, focus rings, and disabled states across all pages

## Formatting
- Currency: EUR with es-ES via Intl.NumberFormat
- Dates: en-US via toLocaleDateString
