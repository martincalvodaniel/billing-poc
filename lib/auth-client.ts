import { createAuthClient } from "better-auth/react"

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : (process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL) || "http://localhost:3000"

export const authClient = createAuthClient({ baseURL })

export const { useSession, signIn, signOut } = authClient
