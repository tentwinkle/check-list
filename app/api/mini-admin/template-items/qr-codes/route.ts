import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import QRCode from "qrcode"
import JSZip from "jszip"

export async function GET(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { area: true },
    })

    if (!user || user.role !== "MINI_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")

    if (!templateId) {
      return NextResponse.json({ message: "Template ID is required" }, { status: 400 })
    }

    // Get template items
    const templateItems = await prisma.checklistItem.findMany({
      where: {
        masterTemplateId: templateId,
      },
      orderBy: { order: "asc" },
    })

    if (templateItems.length === 0) {
      return NextResponse.json({ message: "No template items found" }, { status: 404 })
    }

    // Create ZIP file with all QR codes
    const zip = new JSZip()

    for (const item of templateItems) {
      const qrCodeBuffer = await QRCode.toBuffer(item.qrCodeId, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })

      const fileName = `${item.order.toString().padStart(2, "0")}-${item.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`
      zip.file(fileName, qrCodeBuffer)
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="template-qr-codes.zip"',
      },
    })
  } catch (error) {
    console.error("Error generating QR codes:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'