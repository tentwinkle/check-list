import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { qrCodeId: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "INSPECTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the checklist item with this QR code
    const checklistItem = await prisma.checklistItem.findFirst({
      where: {
        qrCodeId: params.qrCodeId,
      },
      include: {
        masterTemplate: {
          include: {
            inspections: {
              where: {
                inspectorId: session.user.id,
                status: {
                  not: "COMPLETED",
                },
              },
              orderBy: {
                dueDate: "asc",
              },
              take: 1,
            },
          },
        },
      },
    })

    if (!checklistItem) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 })
    }

    // Find the most recent active inspection for this template
    const activeInspection = checklistItem.masterTemplate.inspections[0]

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
