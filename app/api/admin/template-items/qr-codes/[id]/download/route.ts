import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import QRCode from "qrcode"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    // Verify item belongs to organization
    const item = await prisma.checklistItem.findFirst({
      where: {
        id: params.id,
        masterTemplate: {
          organizationId,
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Template item not found" }, { status: 404 })
    }

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(item.qrCodeId, {
      type: "png",
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    return new NextResponse(qrCodeBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="qr-${item.name.replace(/\s+/g, "-").toLowerCase()}.png"`,
      },
    })
  } catch (error) {
    console.error("Error downloading QR code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
