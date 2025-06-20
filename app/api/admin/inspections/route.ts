import { NextResponse } from "next/server"
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

    const inspections = await prisma.inspectionInstance.findMany({
      where: {
        department: {
          organizationId,
        },
      },
      include: {
        masterTemplate: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        inspector: {
          select: {
            name: true,
            email: true,
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
