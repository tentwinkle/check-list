import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["INSPECTOR", "MINI_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const inspection = await prisma.inspectionInstance.findFirst({
      where: {
        id: params.id,
      },
      include: {
        masterTemplate: {
          select: {
            name: true,
            description: true,
          },
        },
        department: {
          select: {
            name: true,
            areaId: true,
          },
        },
        report: {
          include: {
            reportItems: true,
          },
        },
      },
    })

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 })
    }

    if (session.user.role === "INSPECTOR") {
      if (session.user.departmentId !== inspection.departmentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (
        inspection.status === "COMPLETED" &&
        inspection.inspectorId !== session.user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
    if (
      session.user.role === "MINI_ADMIN" &&
      session.user.areaId !== inspection.department.areaId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get checklist items with their results
    const checklistItems = await prisma.checklistItem.findMany({
      where: { masterTemplateId: inspection.masterTemplateId },
      orderBy: { order: "asc" },
      include: {
        reportItems: {
          where: {
            inspectionReport: {
              inspectionInstanceId: inspection.id,
            },
          },
        },
      },
    })

    // Format the response
    const formattedItems = checklistItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      location: item.location,
      qrCodeId: item.qrCodeId,
      order: item.order,
      result: item.reportItems[0]
        ? {
            id: item.reportItems[0].id,
            approved: item.reportItems[0].approved,
            comments: item.reportItems[0].comments,
            imageUrl: item.reportItems[0].imageUrl,
          }
        : undefined,
    }))

    return NextResponse.json({
      ...inspection,
      checklistItems: formattedItems,
    })
  } catch (error) {
    console.error("Error fetching inspection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";