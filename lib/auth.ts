import { betterAuth } from "better-auth"
import { isEmailAllowed } from "./domain/services/auth"

const secret = process.env.BETTER_AUTH_SECRET
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required")
}

const baseURL =
  process.env.VERCEL_URL ?? "http://localhost:3000"

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required"
  )
}

export const auth = betterAuth({
  baseURL,
  secret,
  trustedOrigins: [baseURL],
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60,
      strategy: "jwt",
      refreshCache: true,
    },
  },
  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = typeof user.email === "string" ? user.email : ""
          if (!email || !isEmailAllowed(email)) {
            console.warn(`Sign-in denied for non-allowlisted email: ${email}`)
            return false
          }
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
