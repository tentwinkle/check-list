import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createInspectionForTemplate } from "@/lib/inspection-scheduler"

export async function POST(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["ADMIN", "MINI_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { templateId, inspectorId, dueDate } = await request.json()

    if (!templateId || !inspectorId) {
      return NextResponse.json({ error: "Template ID and Inspector ID are required" }, { status: 400 })
    }

    const inspection = await createInspectionForTemplate(
      templateId,
      inspectorId,
      dueDate ? new Date(dueDate) : undefined,
    )

    return NextResponse.json({
      message: "Inspection created successfully",
      inspection,
    })
  } catch (error) {
    console.error("Error creating inspection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
