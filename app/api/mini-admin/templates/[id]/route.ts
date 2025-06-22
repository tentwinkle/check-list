import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId

    if (!areaId) {
      return NextResponse.json({ error: "Area not found" }, { status: 400 })
    }

    // Verify template belongs to area
    const template = await prisma.masterTemplate.findFirst({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        createdAt: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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

    const body = await request.json()
    const { name, description, departmentId } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Verify template exists and belongs to area (through department)
    const existingTemplate = await prisma.masterTemplate.findFirst({
      where: {
        id: params.id,
        OR: [
          { departmentId: null }, // Global templates
          {
            department: {
              areaId: areaId,
            },
          },
        ],
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // If departmentId is provided, verify it belongs to the area
    if (departmentId && departmentId !== "none") {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          areaId: areaId,
        },
      })

      if (!department) {
        return NextResponse.json({ error: "Department not found in your area" }, { status: 400 })
      }
    }

    const updatedTemplate = await prisma.masterTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        departmentId: departmentId === "none" || !departmentId ? null : departmentId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            checklistItems: true,
            inspections: true,
          },
        },
      },
    })

    await createAuditLog(session.user.id, "UPDATE_TEMPLATE", "Template", params.id)

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error("Error updating template:", error)
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

    const existingTemplate = await prisma.masterTemplate.findFirst({
      where: {
        id: params.id,
        department: { areaId },
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const inspectionCount = await prisma.inspectionInstance.count({
      where: { masterTemplateId: params.id },
    })

    if (inspectionCount > 0) {
      return NextResponse.json({ error: "Cannot delete template with existing inspections" }, { status: 400 })
    }

    await prisma.masterTemplate.delete({ where: { id: params.id } })

    await createAuditLog(session.user.id, "DELETE_TEMPLATE", "Template", params.id)

    return NextResponse.json({ message: "Template deleted" })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
