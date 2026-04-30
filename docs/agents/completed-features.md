# Completed Features

## Accessibility (WCAG 2.1 A)
- Icon-only buttons labeled; modals with dialog roles; alert/status live regions; focus rings; aria-expanded on toggles; color-scheme meta

## Payment List & Visualization
- Summary cards (income/outcome/net)
- Donut charts by tag with sorting, stable colors, scrollable legend, 100% edge-case handling
- Responsive grid; EUR formatting; dynamic month filtering

## Real-Time List Updates
- Form submission refreshes list and navigates to saved payment month
- Parent coordinates refresh + navigate

## Month Navigation
- Current-month default; prev/next; calendar picker; empty state
- Date column day-only; VAT `(percent%) amount`
- Form date sync via onMonthChange and PaymentForm ref

## Modal Editing
- Edit date/type/tag/total/vat via overlay modal
- PUT /api/payments with validation and recalcs; optimistic UI; success toast

## Tags with Autocomplete
- Type-specific tags; GET /api/tags; debounce search; new tags added post-save; inline editing uses same flow

## Delete Payment
- Confirmation modal with payment details; DELETE /api/payments; optimistic removal; success toast

## VAT & Total Editing
- Total and VAT editable; server recalculates net/vat amounts; optimistic updates
