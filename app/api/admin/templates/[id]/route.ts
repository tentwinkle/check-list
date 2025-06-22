import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    // Verify template belongs to organization
    const template = await prisma.masterTemplate.findFirst({
      where: {
        id: params.id,
        organizationId,
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

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const { name, description, frequency, departmentId } = await request.json()

    // Verify template belongs to organization
    const existingTemplate = await prisma.masterTemplate.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Verify department belongs to organization if provided
    if (departmentId && departmentId !== "none") {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId,
        },
      })

      if (!department) {
        return NextResponse.json({ error: "Invalid department" }, { status: 400 })
      }
    }

    const template = await prisma.masterTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description,
        frequency,
        departmentId: departmentId === "none" ? null : departmentId,
      },
    })

    await createAuditLog(session.user.id, "UPDATE_TEMPLATE", "Template", params.id)

    return NextResponse.json({
      message: "Template updated successfully",
      template,
    })
  } catch (error) {
    console.error("Error updating template:", error)
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

    // Verify template belongs to organization
    const existingTemplate = await prisma.masterTemplate.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    await prisma.masterTemplate.delete({
      where: { id: params.id },
    })

    await createAuditLog(session.user.id, "DELETE_TEMPLATE", "Template", params.id)

    return NextResponse.json({
      message: "Template deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
