import { NextResponse } from "next/server"
import { getAdminContext } from "@/lib/adminContext"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request)
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { organizationId } = context

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
