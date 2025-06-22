import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId

    if (!areaId) {
      return NextResponse.json({ error: "Area not found" }, { status: 400 })
    }

    const departments = await prisma.department.findMany({
      where: { areaId },
      include: {
        _count: {
          select: {
            users: true,
            templates: true,
            inspections: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId
    const organizationId = session.user.organizationId

    if (!areaId || !organizationId) {
      return NextResponse.json({ error: "Area or organization not found" }, { status: 400 })
    }

    const { departmentName, departmentDescription } = await request.json()

    const department = await prisma.department.create({
      data: {
        name: departmentName,
        description: departmentDescription,
        organizationId,
        areaId,
      },
    })

    await createAuditLog(session.user.id, "CREATE_DEPARTMENT", "Department", department.id)

    return NextResponse.json({
      message: "Department created successfully",
      department,
    })
  } catch (error) {
    console.error("Error creating department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
