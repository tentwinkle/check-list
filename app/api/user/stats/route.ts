import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's inspection statistics based on their role
    let inspectionStats

    if (session.user.role === "INSPECTOR") {
      // For inspectors, get their assigned inspections
      inspectionStats = await prisma.inspectionInstance.findMany({
        where: {
          assignedInspectorId: userId,
        },
        select: {
          status: true,
        },
      })
    } else if (session.user.role === "MINI_ADMIN") {
      // For mini-admins, get inspections in their area
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { area: true },
      })

      if (user?.area) {
        inspectionStats = await prisma.inspectionInstance.findMany({
          where: {
            department: {
              areaId: user.area.id,
            },
          },
          select: {
            status: true,
          },
        })
      } else {
        inspectionStats = []
      }
    } else if (session.user.role === "ADMIN") {
      // For admins, get all inspections in their organization
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      })

      if (user?.organization) {
        inspectionStats = await prisma.inspectionInstance.findMany({
          where: {
            department: {
              area: {
                organizationId: user.organization.id,
              },
            },
          },
          select: {
            status: true,
          },
        })
      } else {
        inspectionStats = []
      }
    } else if (session.user.role === "SUPER_ADMIN") {
      // For super admins, get all inspections
      inspectionStats = await prisma.inspectionInstance.findMany({
        select: {
          status: true,
        },
      })
    } else {
      inspectionStats = []
    }

    // Calculate statistics
    const totalInspections = inspectionStats.length
    const completedInspections = inspectionStats.filter((inspection) => inspection.status === "COMPLETED").length
    const pendingInspections = inspectionStats.filter((inspection) => inspection.status === "PENDING").length
    const successRate = totalInspections > 0 ? Math.round((completedInspections / totalInspections) * 100) : 0

    return NextResponse.json({
      totalInspections,
      completedInspections,
      pendingInspections,
      successRate,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
