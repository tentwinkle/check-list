import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: {
        name,
        description,
      },
    })

    return NextResponse.json({
      message: "Organization updated successfully",
      organization,
    })
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.organization.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: "Organization deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
