import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Public auth routes
  if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Edge-runtime safe: only check cookie presence, not validity.
  // Full validation happens in API routes via requireAuth().
  const sessionCookie = getSessionCookie(request)
  if (sessionCookie) {
    return NextResponse.next()
  }

  const signInUrl = new URL("/auth/signin", request.url)
  if (pathname !== "/") {
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`)
  }
  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public|.*\\..*).*)"],
}
