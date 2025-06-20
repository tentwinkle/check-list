import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId

    if (!areaId) {
      return NextResponse.json({ error: "Area not found" }, { status: 400 })
    }

    // Get area information
    const area = await prisma.area.findUnique({
      where: { id: areaId },
      select: { name: true },
    })

    const [totalDepartments, totalUsers, totalTemplates, inspectionStats] = await Promise.all([
      prisma.department.count({
        where: { areaId },
      }),
      prisma.user.count({
        where: { areaId },
      }),
      prisma.masterTemplate.count({
        where: {
          department: {
            areaId,
          },
        },
      }),
      // Get detailed inspection statistics
      prisma.inspectionInstance.findMany({
        where: {
          department: {
            areaId,
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
      totalDepartments,
      totalUsers,
      totalTemplates,
      totalInspections,
      activeInspections,
      completedInspections,
      pendingInspections,
      dueSoonInspections,
      overdueInspections,
      areaName: area?.name || "Unknown Area",
    })
  } catch (error) {
    console.error("Error fetching mini-admin stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
