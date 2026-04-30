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

### PaymentForm Component Pattern
- **State**: formData with PaymentFormData type including concepts array
- **Concepts**: Array of { name?: string, amount: number } objects
- **Handlers for Concepts**:
  - `handleChange(e, conceptIndex?)`: Updates form or concept by index
  - `addConcept()`: Appends new empty concept to array
  - `removeConcept(index)`: Removes concept (only if more than 1 exists)
  - `calculateTotal()`: Sums all concept amounts
  - `calculateVatAmount()` and `calculateNetAmount()`: Use calculateTotal() result
- **Validation**: Client checks at least one concept has amount > 0 before API call
- **API Call**: Send full formData with concepts array; API handles validation and calculations
- **Success**: Reset concepts to [{ amount: 0 }] while keeping type/date sticky

### Component Extraction & Organization
Extract components when they appear in multiple places or represent a cohesive UI unit:
- **MonthlyPaymentsView**: Monthly payment list with editing, deletion, and filtering (replaces inline logic)
- **MonthlyBreakdown**: Monthly totals breakdown visualization (extracted from year view)
- **SummaryCard**: Shows financial summaries with optional payment counts
- **MonthSelector**: Calendar picker reused across pages
- **YearSelector**: Year navigation reused across pages
- **DonutChart**: Visualization reused for income/outcome tag breakdowns
- Document extracted components in [patterns-ui.md](./patterns-ui.md) with Props, Features, and Integration Notes

### Component Folder Strategy
**Shared Components** → `/app/components/`: Components used across multiple pages (DonutChart, NavigationBar, SummaryCard)
**Page-Specific Components** → `/app/[page]/components/`: Components only used by one page, co-located for clarity and easier refactoring (e.g., `/app/month/components/MonthSelector.tsx`)

Benefits of this hybrid approach:
- Improves organization as pages grow
- Makes it obvious which page owns which components
- Simplifies removal of entire features (delete page folder and its components together)
- Shared utilities remain centralized and easy to import

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
