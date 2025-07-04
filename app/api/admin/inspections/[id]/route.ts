import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { extractOrganizationId } from "@/lib/admin"
import { createAuditLog } from "@/lib/audit"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = extractOrganizationId(session, request)

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      )
    }

    const userDepartmentId = session.user.departmentId

    const existingInspection = await prisma.inspectionInstance.findFirst({
      where: {
        id: params.id,
        department: {
          organizationId,
          ...(userDepartmentId ? { id: userDepartmentId } : {}),
        },
      },
    })

    if (!existingInspection) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 },
      )
    }

    await prisma.inspectionInstance.delete({ where: { id: params.id } })

    await createAuditLog(
      session.user.id,
      "DELETE_INSPECTION",
      "InspectionInstance",
      params.id,
    )

    return NextResponse.json({ message: "Inspection deleted successfully" })
  } catch (error) {
    console.error("Error deleting inspection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
