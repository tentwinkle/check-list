import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { InspectionInterface } from "@/components/inspector/inspection-interface"

interface InspectionPageProps {
  params: {
    id: string
  }
}

export default async function InspectionPage({ params }: InspectionPageProps) {
  const session: Session | null = await getServerSession(authOptions)

  if (!session || session.user.role !== "INSPECTOR") {
    redirect("/auth/signin")
  }

  return <InspectionInterface inspectionId={params.id} />
}
