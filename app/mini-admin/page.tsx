import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MiniAdminDashboard } from "@/components/mini-admin/dashboard"

export default async function MiniAdminPage() {
  const session: Session | null = await getServerSession(authOptions)

  if (!session || session.user.role !== "MINI_ADMIN") {
    redirect("/auth/signin")
  }

  return <MiniAdminDashboard />
}
