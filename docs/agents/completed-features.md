# Completed Features

## Payment Components/Concepts
- Payments composed of multiple named or unnamed concepts (line items)
- Each concept has amount and optional descriptive name
- UI supports adding/removing components with clear visual layout
- Total payment calculated as sum of all component amounts
- VAT applied at payment level; future enhancement supports concept-level VAT override
- Form validates at least one component has non-zero amount
- API supports both new concepts format and legacy single-total format (backward compatible)

## Client Management
- Full CRUD operations for managing business contacts
- Support for two client types: individuals/freelancers and companies
- Store client information: name/business name, tax ID (NIF/CIF/NIE), tax address, and optional phone and email
- Search clients by name or tax ID with real-time filtering (case-insensitive)
- Client list view with modal editing
- **Clickable rows** - Click any client row to edit in a centered modal
- **Modal editing** - Edit client details in a modal overlay (matches payment modal patterns)
- **Delete confirmation modal** - Confirmation modal for safe deletion with client details
- Create and delete client records via form modal
- Sorted client display (by name ascending)
- **Keyboard navigation** - ESC key closes modals, click outside backdrop to cancel
- **Modal consistency** - All modals use `bg-black/50` backdrop, proper dialog roles, and accessibility patterns

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

## Payment Detail Modal
- Action button in monthly list opens a read-only modal
- Displays date, type, tag, total, VAT (percentage and amount), net amount
- Lists all payment components (name, amount, optional concept-level VAT)
- Accessible dialog with keyboard and screen reader support; consistent styling with other modals

## VAT & Total Editing
- Total and VAT editable; server recalculates net/vat amounts; optimistic updates

## Component Extraction & Refactoring
- **MonthlyBreakdown**: Extracted monthly totals visualization from year/page.tsx for reuse and cleaner code (shows monthly income/outcome/net with progress bars); month names are clickable links that navigate to `/month?month=X&year=YYYY` to view detailed month data
- **MonthlyPaymentsView**: Renamed from PaymentsList for clarity; handles monthly payment display, CRUD, and filtering with full modal editing support
- **Modal Component (Reusable)**: Extracted centralized modal wrapper from repeated overlay/dialog patterns across 5 modal instances (PaymentDetailModal, MonthlyPaymentsView edit/delete, ClientList edit/delete). Provides consistent backdrop styling (`bg-black/50`), keyboard handling (ESC/ENTER configurable), accessibility (dialog roles, aria-labelledby), and dark mode support. Reduces ~200 lines of boilerplate code and ensures future modals use the same proven pattern
- **PageLayout Component (Shared Layout)**: Extracted shared page structure from all three main pages (month, year, clients) into a single reusable component at `/app/components/PageLayout.tsx`. Enforces consistent outer container, main wrapper, navigation bar, page header (title + subtitle), and optional headerContent for filters/selectors. Prevents layout drift, provides single source of truth for structure, and ensures uniform spacing/typography/dark mode across all pages. Migrated all existing pages to use this pattern.
- Pure display components follow React.memo pattern; composite components encapsulate state management

## Invoice Generation & Provider Bills
- **PDF Invoice Generation**: Generate professional PDF invoices for income payments using pdf-lib (serverless-compatible)
  - 4 independent sequential series: Invoice, RectificativeInvoice, SimpleInvoice, RectificativeSimpleInvoice
  - Each series maintains separate sequential numbering (e.g., Invoice-000001, RectificativeInvoice-000001)
  - Atomic counter updates using MongoDB findOneAndUpdate with upsert
  - PDFs include payment details, line items, tax breakdown, client info, and company branding placeholders
  - Uses pdf-lib with embedded StandardFonts (no external font files required for serverless)
- **Provider Bill Upload**: Upload provider bill PDFs for outcome payments
  - File validation: PDF only, max 10MB
  - Supports replacing existing bills
- **Vercel Blob Storage**: All PDFs stored in Vercel Blob with public download URLs
- **UI Integration**: 
  - PaymentDetailModal: Generate invoice button with series selector for income; file upload for outcome
  - PaymentForm: Optional provider bill upload field for outcome payments
  - Download links for both generated invoices and uploaded provider bills
- **API Endpoints**: 
  - POST /api/invoices/generate (income payments)
  - POST /api/invoices/upload (outcome payments with FormData)
  - GET /api/invoices/[id] (retrieve invoice/bill metadata)
- **Type Safety**: Full TypeScript support with InvoiceSeries, InvoiceMetadata, and InvoiceCounter types

