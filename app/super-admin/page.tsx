import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SuperAdminDashboard } from "@/components/super-admin/dashboard"

export default async function SuperAdminPage() {
  const session: Session | null = await getServerSession(authOptions)

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/auth/signin")
  }

  return <SuperAdminDashboard />
}
