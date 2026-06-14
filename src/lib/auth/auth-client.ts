"use client"

import { createAuthClient } from "better-auth/react"
import { getAuthBaseURL } from "./base-url"

const baseURL =
  typeof window !== "undefined" ? window.location.origin : getAuthBaseURL()

export const authClient = createAuthClient({ baseURL })

export const { useSession, signOut } = authClient
