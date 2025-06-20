import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import QRCode from "qrcode"

export async function GET(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    const organizationId = session.user.organizationId

    // Verify template belongs to organization
    const template = await prisma.masterTemplate.findFirst({
      where: {
        id: templateId,
        organizationId,
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const items = await prisma.checklistItem.findMany({
      where: { masterTemplateId: templateId },
      orderBy: { order: "asc" },
    })

    // Generate QR codes for each item
    const itemsWithQR = await Promise.all(
      items.map(async (item) => {
        const qrCodeUrl = await QRCode.toDataURL(item.qrCodeId, {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })

        return {
          ...item,
          qrCodeUrl,
        }
      }),
    )

    return NextResponse.json(itemsWithQR)
  } catch (error) {
    console.error("Error generating QR codes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'