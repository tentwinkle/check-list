import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [totalOrganizations, totalUsers, activeInspections] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.inspectionInstance.count({
        where: {
          status: {
            in: ["PENDING", "IN_PROGRESS"],
          },
        },
      }),
    ])

    return NextResponse.json({
      totalOrganizations,
      totalUsers,
      activeInspections,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";
