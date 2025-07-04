import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin/dashboard"
import type { Session } from "next-auth"

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { organizationId?: string }
}) {
  const session: Session | null = await getServerSession(authOptions)

  const isAdmin = session && session.user.role === "ADMIN"
  const isSuperAdmin = session && session.user.role === "SUPER_ADMIN"
  const organizationId = isSuperAdmin
    ? searchParams?.organizationId
    : session?.user.organizationId

  if (!session || (!isAdmin && !isSuperAdmin)) {
    redirect("/auth/signin")
  }

  if (isSuperAdmin && !organizationId) {
    redirect("/super-admin")
  }

  return <AdminDashboard organizationId={organizationId} />
}