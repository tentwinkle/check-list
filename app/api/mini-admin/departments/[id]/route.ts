import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

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

    await createAuditLog(session.user.id, "UPDATE_DEPARTMENT", "Department", params.id)

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

    await prisma.$transaction([
      prisma.user.deleteMany({ where: { departmentId: params.id } }),
      prisma.inspectionInstance.deleteMany({ where: { departmentId: params.id } }),
      prisma.masterTemplate.deleteMany({ where: { departmentId: params.id } }),
      prisma.department.delete({ where: { id: params.id } }),
    ])

    await createAuditLog(session.user.id, "DELETE_DEPARTMENT", "Department", params.id)

    return NextResponse.json({
      message: "Department deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";