import { createAuthClient } from "better-auth/react"
import { getAuthBaseURL } from "./auth-base-url"

const baseURL =
  typeof window !== "undefined" ? window.location.origin : getAuthBaseURL()

export const authClient = createAuthClient({ baseURL })

export const { useSession, signOut } = authClient
