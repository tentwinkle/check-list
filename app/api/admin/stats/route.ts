import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

export async function GET(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId =
      session.user.role === "SUPER_ADMIN"
        ? searchParams.get("organizationId")
        : session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const [totalAreas, totalDepartments, totalUsers, totalTemplates, inspectionStats] = await Promise.all([
      prisma.area.count({
        where: { organizationId },
      }),
      prisma.department.count({
        where: { organizationId },
      }),
      prisma.user.count({
        where: { organizationId },
      }),
      prisma.masterTemplate.count({
        where: { organizationId },
      }),
      // Get detailed inspection statistics
      prisma.inspectionInstance.findMany({
        where: {
          department: {
            organizationId,
          },
        },
        select: {
          id: true,
          status: true,
          dueDate: true,
          completedAt: true,
        },
      }),
    ])

    // Calculate inspection statistics
    const now = new Date()
    const bufferDays = 3 // Days before due date to consider "due soon"

    const totalInspections = inspectionStats.length
    let completedInspections = 0
    let pendingInspections = 0
    let dueSoonInspections = 0
    let overdueInspections = 0
    let activeInspections = 0

    inspectionStats.forEach((inspection) => {
      if (inspection.status === "COMPLETED") {
        completedInspections++
      } else {
        activeInspections++
        const dueDate = new Date(inspection.dueDate)
        const diffTime = dueDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
          // Overdue
          overdueInspections++
        } else if (diffDays <= bufferDays) {
          // Due soon
          dueSoonInspections++
        } else {
          // Pending (not due yet)
          pendingInspections++
        }
      }
    })

    return NextResponse.json({
      totalAreas,
      totalDepartments,
      totalUsers,
      totalTemplates,
      totalInspections,
      activeInspections,
      completedInspections,
      pendingInspections,
      dueSoonInspections,
      overdueInspections,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
