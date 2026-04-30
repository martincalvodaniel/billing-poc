# Data & API Patterns

## Database Operations
- Use getDatabase(); typed collections db.collection<Payment>("payments")
- Common ops: find/insertOne/updateOne/deleteOne; sort by date desc

## Validation
- Server: require type/date/total/vat; parse numbers; VAT range 0-100
- Client: use HTML validation attrs; disable submit during processing
- Net/VAT calc: net = total / (1 + vat%/100); vatAmount = total - net

## Error Handling
- Wrap DB ops in try/catch
- Log with template literals; return friendly JSON error
- Use proper status codes (400 validation, 404 not found, 500 server)

## Environment
- MONGODB_URI required (.env.local for dev)

## Performance
- Typed queries; avoid extra libs; no external UI kits
- Mongo connection singleton

## Security
- Validate all user input server-side
- Mongo driver mitigates injection; keep env vars server-side
