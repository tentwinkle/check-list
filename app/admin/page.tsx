import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin/dashboard"
import { SuperAdminBanner } from "@/components/admin/super-admin-banner"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-6">
      <SuperAdminBanner />
      <AdminDashboard />
    </div>
  )
}
