# UI Patterns

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
- Track selectedDate (1st of month) and showCalendar flag
- Calendar: 12-month grid, prev/next month, year controls
- Click-outside closes; current-month shortcut button
- Filter payments by month/year; summaries use filtered set
- Date column shows day-only; VAT column `(percent%) amount`
- Expose onMonthChange to sync form date (YYYY-MM-01)
- Add-payment modal trigger lives beside the calendar controls; share the same button styles, focus ring, and disabled state semantics as navigation buttons

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
