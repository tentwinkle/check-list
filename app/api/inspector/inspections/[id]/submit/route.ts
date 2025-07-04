import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["INSPECTOR", "MINI_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify inspection belongs to inspector
    const inspection = await prisma.inspectionInstance.findFirst({
      where: {
        id: params.id,
      },
      include: {
        report: {
          include: {
            reportItems: true,
          },
        },
        masterTemplate: {
          include: {
            checklistItems: true,
          },
        },
        department: true,
      },
    })

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSPECTOR" &&
      session.user.departmentId !== inspection.departmentId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (
      session.user.role === "MINI_ADMIN" &&
      session.user.areaId !== inspection.department.areaId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (inspection.status === "COMPLETED") {
      return NextResponse.json({ error: "Inspection already completed" }, { status: 400 })
    }

    if (!inspection.report) {
      return NextResponse.json({ error: "No inspection report found" }, { status: 400 })
    }

    // Check if all items are completed
    const totalItems = inspection.masterTemplate.checklistItems.length
    const completedItems = inspection.report.reportItems.length

    if (completedItems < totalItems) {
      return NextResponse.json(
        { error: `Incomplete inspection: ${completedItems}/${totalItems} items completed` },
        { status: 400 },
      )
    }

    // Update inspection status and completion time
    await prisma.inspectionInstance.update({
      where: { id: inspection.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        inspectorId: session.user.id,
      },
    })

    // Lock the report
    await prisma.inspectionReport.update({
      where: { id: inspection.report.id },
      data: {
        locked: true,
        submittedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Inspection submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting inspection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";