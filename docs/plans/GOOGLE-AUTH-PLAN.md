# Google Authentication Plan

## Overview
Add Google OAuth login using **NextAuth.js (Auth.js v5)** with **JWT sessions** (stateless). Only allowlisted email addresses can access the app. Deployed on **Vercel**.

---

## Architecture

```
lib/auth.ts                   → NextAuth config (Google provider, JWT, email allowlist)
lib/domain/services/auth.ts   → Allowlist check logic (domain service)
app/api/auth/[...nextauth]/route.ts → Auth.js API route handler
middleware.ts                  → Protect all routes except /auth/signin
app/auth/signin/page.tsx       → Custom sign-in page (Google button)
.env.local                     → Secrets (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, ALLOWED_EMAILS)
```

---

## Step-by-step Plan

### 1. Install Dependencies
```bash
bun add next-auth@beta
```
Auth.js v5 (beta) supports Next.js App Router natively.

### 2. Google Cloud Console Setup (Manual)
- Go to https://console.cloud.google.com/apis/credentials
- Create OAuth 2.0 Client ID
  - **Authorized redirect URIs**: `https://<your-domain>/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`
- Note the Client ID and Client Secret

### 3. Environment Variables
Create `.env.local`:
```env
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
NEXTAUTH_SECRET=<random-secret>  # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
ALLOWED_EMAILS=user1@gmail.com,user2@gmail.com
```

### 4. Domain Service — Email Allowlist
**File: `lib/domain/services/auth.ts`**
```ts
export function isEmailAllowed(email: string): boolean {
  const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowedEmails.includes(email.toLowerCase())
}
```

### 5. NextAuth Configuration
**File: `lib/auth.ts`**
```ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { isEmailAllowed } from "./domain/services/auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",  // redirect errors to sign-in page
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !isEmailAllowed(user.email)) {
        return false  // deny access
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
})
```

### 6. API Route Handler
**File: `app/api/auth/[...nextauth]/route.ts`**
```ts
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

### 7. Middleware — Protect All Routes
**File: `middleware.ts` (project root)**
```ts
import { auth } from "@/lib/auth"

export default auth((req) => {
  const isSignInPage = req.nextUrl.pathname.startsWith("/auth")
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth")

  if (!req.auth && !isSignInPage && !isApiAuth) {
    return Response.redirect(new URL("/auth/signin", req.url))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

### 8. Custom Sign-in Page
**File: `app/auth/signin/page.tsx`**
```tsx
"use client"
import { signIn } from "next-auth/react"

export default function SignInPage() {
  // Google sign-in button with Tailwind styling
  // Shows error message if email not in allowlist
  // Uses PageLayout for consistent look
}
```

### 9. User Info in Navigation
- Add user avatar/name to NavigationBar
- Add sign-out button in mobile menu and desktop nav
- Use `useSession()` from `next-auth/react` in client components
- Wrap layout with `<SessionProvider>` in `app/layout.tsx`

### 10. Protect API Routes
For API routes that handle data (`/api/payments`, `/api/clients`, etc.):
```ts
import { auth } from "@/lib/auth"

// At the top of each API route handler:
const session = await auth()
if (!session) {
  return Response.json({ error: "Unauthorized" }, { status: 401 })
}
```

---

## Security Considerations
- JWT secret must be strong (≥32 bytes)
- ALLOWED_EMAILS env var keeps the allowlist outside of code
- Middleware runs on Edge — blocks unauthenticated requests before they reach pages
- API routes double-check auth (defense in depth)
- CSRF protection built into NextAuth
- Google tokens are NOT stored (JWT only contains user info)

## Vercel Deployment
- Set env vars in Vercel Dashboard: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, ALLOWED_EMAILS
- Set NEXTAUTH_URL to production URL (Vercel auto-detects if not set)
- Add production callback URL to Google Console

## Testing
- Manually test: unauthenticated → redirect to sign-in
- Manually test: non-allowlisted email → denied with error message
- Manually test: allowlisted email → can access all pages
- Manually test: sign out → redirected to sign-in

## Files Changed (Summary)
| File | Action |
|------|--------|
| `package.json` | Add `next-auth@beta` |
| `lib/auth.ts` | NEW — NextAuth config |
| `lib/domain/services/auth.ts` | NEW — email allowlist logic |
| `app/api/auth/[...nextauth]/route.ts` | NEW — auth API handler |
| `middleware.ts` | NEW — route protection |
| `app/auth/signin/page.tsx` | NEW — sign-in page |
| `app/layout.tsx` | Wrap with SessionProvider |
| `app/components/NavigationBar.tsx` | Add user info + sign-out |
| `app/api/payments/route.ts` | Add auth check |
| `app/api/clients/route.ts` | Add auth check |
| `app/api/tags/route.ts` | Add auth check |
| `app/api/invoices/*/route.ts` | Add auth check |
| `.env.local` | NEW — secrets (not committed) |
| `.env.example` | NEW — template for env vars |
