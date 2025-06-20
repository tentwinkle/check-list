import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import QRCode from "qrcode"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the template item
    const templateItem = await prisma.checklistItem.findFirst({
      where: {
        id: params.id,
      },
    })

    if (!templateItem) {
      return NextResponse.json({ message: "Template item not found" }, { status: 404 })
    }

    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(templateItem.qrCodeId, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    return new NextResponse(qrCodeBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${templateItem.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-qr.png"`,
      },
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
