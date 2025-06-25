import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await prisma.user.findFirst({
      where: { organizationId: params.id, role: "ADMIN" },
      select: { id: true, name: true, email: true },
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    return NextResponse.json(admin)
  } catch (error) {
    console.error("Error fetching admin user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";