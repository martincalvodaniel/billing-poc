import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function requireAuth() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
