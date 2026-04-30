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

## API Routes
- Return NextResponse.json()
- Support GET/POST/PUT; validate all inputs
- Parse numeric strings (parseFloat/parseInt)
- Use correct HTTP status codes

## Console Logging
- Always template literals: console.error(`Error context: ${error}`)
- Avoid comma-separated logging

## Styling
- Tailwind-only; mobile-first (sm/md/lg)
- Colors: income green, outcome red, balance blue
- Dark mode supported via color-scheme meta

## Formatting
- Currency: EUR with es-ES via Intl.NumberFormat
- Dates: en-US via toLocaleDateString
