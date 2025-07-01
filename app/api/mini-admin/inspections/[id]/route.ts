import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId
    if (!areaId) {
      return NextResponse.json({ error: "Area not found" }, { status: 400 })
    }

    const inspection = await prisma.inspectionInstance.findFirst({
      where: { id: params.id, department: { areaId } },
      include: { report: { include: { reportItems: true } } },
    })

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 })
    }

    if (inspection.status !== "PENDING" || (inspection.report && inspection.report.reportItems.length > 0)) {
      return NextResponse.json({ error: "Cannot delete inspection that has started" }, { status: 400 })
    }

    await prisma.inspectionInstance.delete({ where: { id: params.id } })

    return NextResponse.json({ message: "Inspection deleted" })
  } catch (error) {
    console.error("Error deleting inspection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
