import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthRoute =
    pathname.startsWith("/auth") || pathname.startsWith("/api/auth")

  if (!req.auth && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
