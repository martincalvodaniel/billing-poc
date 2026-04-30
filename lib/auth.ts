import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { isEmailAllowed } from "./domain/services/auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Important for NextAuth to work correctly behind a proxy (like Vercel's or in local development with ngrok)
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !isEmailAllowed(user.email)) {
        return false
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
