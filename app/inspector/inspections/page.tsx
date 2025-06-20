import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { InspectionsList } from "@/components/inspector/inspections-list"

export default async function InspectionsPage() {
  const session: Session | null = await getServerSession(authOptions)

  if (!session || session.user.role !== "INSPECTOR") {
    redirect("/auth/signin")
  }

  return <InspectionsList />
}
