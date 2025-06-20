import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const templates = await prisma.masterTemplate.findMany({
      where: { organizationId },
      include: {
        department: {
          select: {
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Verify department belongs to the organization if provided
    if (departmentId && departmentId !== "none" && departmentId !== "") {
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

    const template = await prisma.masterTemplate.create({
      data: {
        name,
        description,
        frequency,
        organizationId,
        departmentId: departmentId === "none" || departmentId === "" ? null : departmentId,
      },
    })

    return NextResponse.json({
      message: "Template created successfully",
      template,
    })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
