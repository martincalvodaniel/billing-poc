# Completed Features

## Payment Components/Concepts
- Payments composed of multiple named or unnamed concepts (line items)
- Each concept has amount and optional descriptive name
- UI supports adding/removing components with clear visual layout
- Total payment calculated as sum of all component amounts
- VAT applied at payment level; future enhancement supports concept-level VAT override
- Form validates at least one component has non-zero amount
- API supports both new concepts format and legacy single-total format (backward compatible)

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
- Dedicated filter section at top (matching year filter structure)
- Current-month default; prev/next buttons; calendar picker with month/year controls
- Click-outside closes calendar; current-month shortcut disables when active
- Date column shows day-only; VAT displays as `(percent%) amount`
- Form date syncs via onMonthChange callback with PaymentForm ref
- Add-payment button integrated in filter header for consistent UX
- **SummaryCards**: Display financial totals with payment counts integrated into labels

## Modal Editing
- Edit date/type/tag/total/vat via overlay modal
- PUT /api/payments with validation and recalcs; optimistic UI; success toast

## Tags with Autocomplete
- Type-specific tags; GET /api/tags; debounce search; new tags added post-save; inline editing uses same flow

## Delete Payment
- Confirmation modal with payment details; DELETE /api/payments; optimistic removal; success toast

## VAT & Total Editing
- Total and VAT editable; server recalculates net/vat amounts; optimistic updates

## Component Extraction & Refactoring
- **MonthlyBreakdown**: Extracted monthly totals visualization from year/page.tsx for reuse and cleaner code (shows monthly income/outcome/net with progress bars); month names are clickable links that navigate to `/month?month=X&year=YYYY` to view detailed month data
- **MonthlyPaymentsView**: Renamed from PaymentsList for clarity; handles monthly payment display, CRUD, and filtering with full modal editing support
- Pure display components follow React.memo pattern; composite components encapsulate state management
