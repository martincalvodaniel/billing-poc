import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { isEmailAllowed } from "@/lib/domain/services/auth"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user || !isEmailAllowed(session.user.email ?? "")) {
    redirect("/auth/signin")
  }

  return children
}
