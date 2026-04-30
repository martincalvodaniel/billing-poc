# GitHub Copilot Instructions

This file is automatically used by GitHub Copilot in VS Code. For comprehensive guidelines on working with this codebase, refer to the [AGENTS.md](../AGENTS.md) file in the project root.

## Quick Summary

**Billing POC** is a Next.js 16 + TypeScript + React 19 + MongoDB billing system with strict type safety.

### Key Principles
- ✅ **Type-safe**: Use strict TypeScript, avoid `any`
- ✅ **Validate everything**: Server-side validation is mandatory on all API routes
- ✅ **Tailwind only**: All styling via Tailwind CSS utilities (no CSS files)
- ✅ **Functional components**: React 19 hooks with `'use client'` directive when needed
- ✅ **Consistent patterns**: Follow existing code structure and conventions

### Essential Patterns

**API Routes** - Always validate and return proper status codes:
```typescript
// app/api/[resource]/route.ts
if (!type || !date || total === undefined || vat === undefined) {
  return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
}

const vatPercentage = parseFloat(vat);
if (vatPercentage < 0 || vatPercentage > 100) {
  return NextResponse.json({ error: "VAT percentage must be between 0 and 100" }, { status: 400 });
}
```

**Payment Calculation** - VAT as percentage, net extracted from total:
```typescript
const totalAmount = parseFloat(total);
const vatPercentage = parseFloat(vat);
const netAmount = totalAmount / (1 + vatPercentage / 100);
const vatAmount = totalAmount - netAmount;
```

**Database** - Use typed collections:
```typescript
const db = await getDatabase();
const result = await db.collection<Payment>("payments").find({}).toArray();
```

**Components** - Functional with proper typing:
```typescript
'use client';
import type { Payment } from '@/lib/types';

export default function Component({ payment }: { payment: Payment }) {
  // component logic
}
```

**Form Handling** - Use default values for better UX:
```typescript
const [formData, setFormData] = useState({
  type: 'income',
  date: new Date().toISOString().split('T')[0],
  total: '',
  vat: '21', // Default VAT percentage
});
```

### Before Completing Tasks
- [ ] TypeScript strict mode compliance
- [ ] All types in `lib/types.ts`
- [ ] Server-side validation on APIs
- [ ] Tailwind CSS only (no custom CSS)
- [ ] `pnpm lint` passes
- [ ] No `any` types

**For full details and guidelines, see [AGENTS.md](../AGENTS.md)**
