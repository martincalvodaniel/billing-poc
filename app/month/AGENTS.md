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
| `MonthSelector` | Calendar picker (12-month grid, keyboard nav) |

## Form State Hook — `usePaymentForm`
Shared between `PaymentForm` and `PaymentDetailModal`. Manages:
- `formData`: type, date, concepts array, vat, surcharge, tag, clientId, deliveryNoteRef
- Handlers: `handleChange` (with optional conceptIndex), `handleClientChange`, `addConcept`, `removeConcept`
- Tag autocomplete suggestions

## Calculation Utilities — `paymentUtils.ts`
Pure functions (37 unit tests via `bun test`):
- `calculateTotal(concepts)` — sum of amount × quantity
- `calculateVatAmount(total, vat, surcharge?)` — VAT portion
- `calculateSurchargeAmount(total, vat, surcharge)` — surcharge portion
- `calculateNetAmount(total, vat, surcharge?)` — net after taxes
- `validateConcepts(concepts)`, `validateVat(vat)`, `validateSurcharge(surcharge)`

## API Endpoints
- `GET /api/payments?year={year}&month={month}` — filtered by month, sorted by date desc
- `POST /api/payments` — create with server-side financial calculations
- `PUT /api/payments` — edit with full recalculation
- `DELETE /api/payments` — remove by `_id`

## Key Behaviors
- After save: type and date persist (sticky), amounts/concepts reset
- Negative totals allowed (refunds)
- Edit opens pre-filled modal; delete shows confirmation dialog
- Month navigation: prev/next buttons + calendar picker dropdown
