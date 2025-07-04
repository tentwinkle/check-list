import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin/dashboard"
import type { Session } from "next-auth"

export default async function AdminPage() {
  const session: Session | null = await getServerSession(authOptions)

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/signin")
  }

  return <AdminDashboard />
}