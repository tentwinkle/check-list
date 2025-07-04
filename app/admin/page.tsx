import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin/dashboard"
import { SuperAdminContextProvider } from "@/components/admin/super-admin-context"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { org?: string }
}) {
  const session: Session | null = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Allow SUPER_ADMIN to access admin dashboard
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/auth/signin")
  }

  // If SuperAdmin is accessing with org parameter, provide context
  if (session.user.role === "SUPER_ADMIN" && searchParams.org) {
    return (
      <SuperAdminContextProvider organizationId={searchParams.org}>
        <AdminDashboard />
      </SuperAdminContextProvider>
    )
  }

  // Regular admin access
  if (session.user.role === "ADMIN") {
    return <AdminDashboard />
  }

  // SuperAdmin without org context should go to super-admin dashboard
  redirect("/super-admin")
}