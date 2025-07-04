import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["INSPECTOR", "MINI_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let where: any = {}
    if (session.user.role === "INSPECTOR") {
      where = { departmentId: session.user.departmentId }
    } else if (session.user.role === "MINI_ADMIN") {
      where = { department: { areaId: session.user.areaId } }
    } else {
      where = { department: { organizationId: session.user.organizationId } }
    }

    const inspections = await prisma.inspectionInstance.findMany({
      where,
      include: {
        masterTemplate: {
          select: {
            name: true,
            description: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    })

    return NextResponse.json(inspections)
  } catch (error) {
    console.error("Error fetching inspections:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";
