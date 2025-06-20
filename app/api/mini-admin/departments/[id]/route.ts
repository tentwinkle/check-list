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

    const { name, description } = await request.json()

    // Verify department belongs to area
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id: params.id,
        areaId,
      },
    })

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    const department = await prisma.department.update({
      where: { id: params.id },
      data: {
        name,
        description,
      },
    })

    return NextResponse.json({
      message: "Department updated successfully",
      department,
    })
  } catch (error) {
    console.error("Error updating department:", error)
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

    // Verify department belongs to area
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id: params.id,
        areaId,
      },
    })

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    // Check if department has users, templates, or inspections
    const [userCount, templateCount, inspectionCount] = await Promise.all([
      prisma.user.count({ where: { departmentId: params.id } }),
      prisma.masterTemplate.count({ where: { departmentId: params.id } }),
      prisma.inspectionInstance.count({ where: { departmentId: params.id } }),
    ])

    if (userCount > 0 || templateCount > 0 || inspectionCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with existing users, templates, or inspections" },
        { status: 400 },
      )
    }

    await prisma.department.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: "Department deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
