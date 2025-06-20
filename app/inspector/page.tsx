import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { InspectorDashboard } from "@/components/inspector/dashboard"

export default async function InspectorPage() {
  const session: Session | null = await getServerSession(authOptions)

  if (!session || session.user.role !== "INSPECTOR") {
    redirect("/auth/signin")
  }

  return <InspectorDashboard />
}
