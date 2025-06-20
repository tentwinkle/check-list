import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const { name, email, role, departmentId } = await request.json()

    // Verify user belongs to area
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        areaId,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: params.id },
        },
      })

      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    // Verify department belongs to area if provided
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          areaId,
        },
      })

      if (!department) {
        return NextResponse.json({ error: "Invalid department" }, { status: 400 })
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        role: role as any,
        departmentId: departmentId || null,
      },
    })

    return NextResponse.json({
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    console.error("Error updating user:", error)
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

    // Verify user belongs to area
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        areaId,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting yourself
    if (params.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Check if user has inspections
    const inspectionCount = await prisma.inspectionInstance.count({
      where: { inspectorId: params.id },
    })

    if (inspectionCount > 0) {
      return NextResponse.json({ error: "Cannot delete user with existing inspections" }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
