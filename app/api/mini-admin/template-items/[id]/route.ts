import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

function generateShortId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const bytes = randomBytes(length)
  let id = ""
  for (let i = 0; i < length; i++) {
    id += chars[bytes[i] % chars.length]
  }
  return id
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId

    if (!areaId) {
      return NextResponse.json({ error: "Area not found" }, { status: 400 })
    }

    // Verify item belongs to area
    const existingItem = await prisma.checklistItem.findFirst({
      where: {
        id: params.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Template item not found" }, { status: 404 })
    }

    const { title, description, type, isRequired, expectedValue } = await request.json()

    // Generate new QR code ID if title changed
    let qrCodeId = existingItem.qrCodeId
    if (title !== existingItem.name) {
      qrCodeId = generateShortId()
    }

    const item = await prisma.checklistItem.update({
      where: { id: params.id },
      data: {
        name: title, // Use 'name' field instead of 'title'
        description,
        qrCodeId,
      },
    })

    return NextResponse.json({
      message: "Template item updated successfully",
      item,
    })
  } catch (error) {
    console.error("Error updating template item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId

    if (!areaId) {
      return NextResponse.json({ error: "Area not found" }, { status: 400 })
    }

    // Verify item belongs to area
    const existingItem = await prisma.checklistItem.findFirst({
      where: {
        id: params.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Template item not found" }, { status: 404 })
    }

    await prisma.checklistItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: "Template item deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting template item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";