# UI Patterns

## Page Layout & Design System

### Navigation Bar (All Pages)
Every page includes a consistent navigation bar:
- Structure: Two-column flex layout with `justify-between`
- Styling: `rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- Left section: "Billing" label + page title (e.g., "Monthly Payments", "Yearly Summary")
- Right section: Navigation links with active/inactive states
  - Active: `text-blue-700 hover:bg-blue-50` + `aria-current="page"`
  - Inactive: `text-zinc-700 hover:bg-zinc-100`

### Page Structure (All Pages)
```
<div class="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950">
  <main class="mx-auto max-w-6xl space-y-8 py-12">
    <!-- Navigation bar -->
    <!-- Page header (h1 + subtitle) -->
    <!-- Content sections with space-y-6 -->
  </main>
</div>
```

### Page Header (All Pages)
- Container: `text-center`
- Heading: `text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50`
- Subtitle: `mt-2 text-lg text-zinc-600 dark:text-zinc-400`

### Content Section Cards
- Container: `space-y-6 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- Header: `border-b border-zinc-200 px-6 py-4 dark:border-zinc-800` with title + controls
- Content: `space-y-6 px-6 pb-6`

## Form Handling
- Controlled inputs; validate on submit
- VAT is percentage (0-100), default 21%
- Net = Total / (1 + VAT%/100); VAT amount = Total - Net
- Allow negative totals (refunds); sticky type/date, reset total after save

## Reusable Visualization
- Extract chart logic to components (e.g., DonutChart)
- Props for data/title/colors; no external UI libs
- Memoize pure visual components; stable color mapping

## Month Navigation
Month selector appears as a dedicated filter section at the top of the page (similar to year filter in yearly view):
- **Container**: Same bordered card style as other filter sections with header containing label and controls
- **State Management**: selectedDate (1st of month) and showCalendar flag managed in parent (page.tsx)
- **Calendar Picker**: 12-month grid, prev/next month buttons, year navigation with prev/next year, year display
- **Functionality**: Click-outside closes calendar; current-month shortcut button disables when viewing current month
- **Data Filtering**: PaymentsList receives selectedDate prop; filters payments by month/year; summaries use filtered set
- **Date Display**: Payment date column shows day-only; VAT displays as `(percent%) amount`
- **Form Sync**: onMonthChange callback syncs form date (YYYY-MM-01) when month changes
- **Add Payment Button**: Located in the month filter header beside calendar and current-month button; shares same button styles, focus ring, and disabled state semantics as navigation buttons
- **PaymentsList Props**: Receives selectedDate as prop; no longer manages month state internally

## Year Navigation
- selectedYear state; prev/next buttons; jump-to-current shortcut
- Year picker dialog: manual input + nearby-year grid; closes on select
- Sync yearInput with selectedYear via useEffect

## Modal Editing
- Centered overlay; track editingPaymentId + editingField
- Field-specific validation; unified save handler calling PUT /api/payments
- Optimistic update; success toast; close resets state

## Tag Autocomplete
- Tags are type-specific (income/outcome)
- GET /api/tags?type=...; refetch on type change
- 1s debounce filter; case-insensitive
- Click/keyboard select; close dropdown; add new tag to list after save

## Delete Confirmation
- Delete button opens confirmation modal with payment details
- DELETE /api/payments; optimistic removal; success toast; handles errors

## Toast Notifications
- Custom toasts, top-center; auto-dismiss ~4s; manual close
- Use semantic colors; slideDown animation in globals.css
