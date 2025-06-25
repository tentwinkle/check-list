import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const { name, description } = await request.json()

    // Verify area belongs to organization
    const existingArea = await prisma.area.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    })

    if (!existingArea) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 })
    }

    const area = await prisma.area.update({
      where: { id: params.id },
      data: {
        name,
        description,
      },
    })

    return NextResponse.json({
      message: "Area updated successfully",
      area,
    })
  } catch (error) {
    console.error("Error updating area:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    // Verify area belongs to organization
    const existingArea = await prisma.area.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    })

    if (!existingArea) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.user.deleteMany({ where: { areaId: params.id } }),
      prisma.area.delete({ where: { id: params.id } }),
    ])

    return NextResponse.json({
      message: "Area deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting area:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
