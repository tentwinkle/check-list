import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId

    if (!areaId) {
      return NextResponse.json({ error: "Area not found" }, { status: 400 })
    }

    const { direction } = await request.json()

    // Verify item belongs to area
    const currentItem = await prisma.checklistItem.findFirst({
      where: {
        id: params.id
      },
    })

    if (!currentItem) {
      return NextResponse.json({ error: "Template item not found" }, { status: 404 })
    }

    const templateId = currentItem.masterTemplateId
    const currentOrder = currentItem.order

    if (direction === "up") {
      // Find the item with the next lower order
      const previousItem = await prisma.checklistItem.findFirst({
        where: {
          masterTemplateId: templateId,
          order: { lt: currentOrder },
        },
        orderBy: { order: "desc" },
      })

      if (previousItem) {
        // Swap orders
        await prisma.checklistItem.update({
          where: { id: currentItem.id },
          data: { order: previousItem.order },
        })
        await prisma.checklistItem.update({
          where: { id: previousItem.id },
          data: { order: currentOrder },
        })
      }
    } else if (direction === "down") {
      // Find the item with the next higher order
      const nextItem = await prisma.checklistItem.findFirst({
        where: {
          masterTemplateId: templateId,
          order: { gt: currentOrder },
        },
        orderBy: { order: "asc" },
      })

      if (nextItem) {
        // Swap orders
        await prisma.checklistItem.update({
          where: { id: currentItem.id },
          data: { order: nextItem.order },
        })
        await prisma.checklistItem.update({
          where: { id: nextItem.id },
          data: { order: currentOrder },
        })
      }
    }

    return NextResponse.json({
      message: "Item reordered successfully",
    })
  } catch (error) {
    console.error("Error reordering template item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
