import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { qrCodeId: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["INSPECTOR", "MINI_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const checklistItem = await prisma.checklistItem.findFirst({
      where: { qrCodeId: params.qrCodeId },
      include: { masterTemplate: true },
    })

    if (!checklistItem) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 })
    }

    // Find the most recent active inspection for this template accessible to the user
    const where: any = {
      masterTemplateId: checklistItem.masterTemplateId,
      status: { not: "COMPLETED" },
    }

    if (session.user.role === "INSPECTOR") {
      where.departmentId = session.user.departmentId
    } else if (session.user.role === "MINI_ADMIN") {
      where.department = { areaId: session.user.areaId }
    } else if (session.user.role === "ADMIN") {
      where.department = { organizationId: session.user.organizationId }
    }

    const activeInspection = await prisma.inspectionInstance.findFirst({
      where,
      orderBy: { dueDate: "asc" },
    })

    if (!activeInspection) {
      return NextResponse.json(
        {
          error: "No active inspection found for this QR code",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      inspectionId: activeInspection.id,
      itemId: checklistItem.id,
      itemName: checklistItem.name,
      templateName: checklistItem.masterTemplate.name,
      itemOrder: checklistItem.order,
    })
  } catch (error) {
    console.error("Error processing QR scan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";