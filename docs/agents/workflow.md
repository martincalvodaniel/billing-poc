# Workflow & Ops

## Setup
- pnpm install
- MongoDB via Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest
- pnpm dev to start app

## Build & Lint
- pnpm build
- pnpm lint

## Useful Commands
- docker stop mongodb; docker start mongodb
- MongoDB Compass URI: mongodb://localhost:27017/billing-poc

## Debugging
- API issues: browser Network tab + console logs
- Mongo issues: verify URI, DB running
- Types: npx tsc --noEmit
- Builds: clear .next then pnpm build

## File Access Guidelines
- Types: check lib/types.ts first
- Styles: Tailwind in components (globals.css only global)
- Components: keep focused and semantic
- API: follow app/api/payments/route.ts patterns
