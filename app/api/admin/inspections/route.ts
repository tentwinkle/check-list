import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"
import { extractOrganizationId } from "@/lib/admin"

export async function GET(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = extractOrganizationId(session, request)

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
