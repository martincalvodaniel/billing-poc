# Month Feature — Payment Management

## Entities
- **Payment**: `type` (income/outcome), `date` (ISO YYYY-MM-DD), `concepts[]`, `vat` (0–100%), optional `surcharge`, `tag`, `clientId`, `deliveryNoteRef`
- **Concept**: `{ name: string, amount: number, quantity: number }` — name is required, quantity defaults to 1

## Component Map
| Component | Role |
|-----------|------|
| `MonthPageContent` | Server component, orchestrates monthly view |
| `MonthlyPaymentsView` | Payment list with edit/delete modals, CRUD |
| `PaymentForm` | Create payment form with concept CRUD |
| `PaymentDetailModal` | Read-only payment detail display |
| `PaymentFormFields` | Reusable form fields molecule |
| `MonthPicker` | Calendar picker (12-month grid, keyboard nav) |

## Form State Hook — `usePaymentForm`
Shared between `PaymentForm` and `PaymentDetailModal`. Manages:
- `formData`: type, date, concepts array, vat, surcharge, tag, clientId, deliveryNoteRef
- Handlers: `handleChange` (with optional conceptIndex), `handleClientChange`, `addConcept`, `removeConcept`
- Tag autocomplete suggestions

## Calculation Utilities — `paymentUtils.ts`
Re-exports pure functions from `lib/domain/services/payment-calculator.ts` (99 unit tests via `bun test`):
- `calculateTotal(concepts)` — sum of amount × quantity
- `calculateVatAmount(total, vat, surcharge?)` — VAT portion
- `calculateSurchargeAmount(total, vat, surcharge)` — surcharge portion
- `calculateNetAmount(total, vat, surcharge?)` — net extracted from VAT-inclusive base (returns number)
- `validateConcepts(concepts)`, `validateVat(vat)`, `validateSurcharge(surcharge)` — local validation helpers

## API Endpoints
- `GET /api/payments?year={year}&month={month}` — filtered by month, sorted by date desc
- `POST /api/payments` — create with server-side financial calculations
- `PUT /api/payments` — edit with full recalculation
- `DELETE /api/payments` — remove by `_id`

## Data Fetching
All month-feature components consume SWR hooks; no direct `fetch` calls in this folder.
- GETs: `usePayments({ year, month })` from `lib/hooks/usePayments`, `useTags(type)` from `lib/hooks/useTags`.
- Mutations: `useCreatePayment` / `useUpdatePayment` / `useDeletePayment` from `lib/hooks/usePaymentMutations`; `useGenerateInvoice` / `useUploadInvoice` from `lib/hooks/useInvoiceMutations`. Each mutation invalidates the payments cache automatically.
- Use `isMutating` to drive submit/delete button states; do not maintain parallel local booleans.

## Key Behaviors
- After save: type and date persist (sticky), amounts/concepts reset
- Negative totals allowed (refunds)
- Edit opens pre-filled modal; delete shows confirmation dialog
- Month navigation: prev/next buttons + calendar picker dropdown
