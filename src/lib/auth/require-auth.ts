import "server-only"

import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { isEmailAllowed } from "@/lib/domain/services/auth"

export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isEmailAllowed(session.user.email ?? "")) {
    console.warn(
      `Forbidden API access for non-allowlisted email: ${session.user.email}`
    )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return null
}
