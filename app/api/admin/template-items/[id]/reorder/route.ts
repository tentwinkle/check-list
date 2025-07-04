import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractOrganizationId } from "@/lib/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { direction } = await request.json();

    const organizationId = extractOrganizationId(session, request);
    const userDepartmentId = session.user.departmentId;

    // Get the current item
    const currentItem = await prisma.checklistItem.findFirst({
      where: {
        id: params.id,
        masterTemplate: {
          organizationId,
          ...(userDepartmentId ? { departmentId: userDepartmentId } : {}),
        },
      },
    });

    if (!currentItem) {
      return NextResponse.json(
        { error: "Template item not found" },
        { status: 404 },
      );
    }

    // Get all items for this template
    const allItems = await prisma.checklistItem.findMany({
      where: { masterTemplateId: currentItem.masterTemplateId },
      orderBy: { order: "asc" },
    });

    const currentIndex = allItems.findIndex((item) => item.id === params.id);

    if (currentIndex === -1) {
      return NextResponse.json(
        { error: "Item not found in template" },
        { status: 404 },
      );
    }

    let targetIndex: number;
    if (direction === "up") {
      if (currentIndex === 0) {
        return NextResponse.json(
          { error: "Item is already at the top" },
          { status: 400 },
        );
      }
      targetIndex = currentIndex - 1;
    } else {
      if (currentIndex === allItems.length - 1) {
        return NextResponse.json(
          { error: "Item is already at the bottom" },
          { status: 400 },
        );
      }
      targetIndex = currentIndex + 1;
    }

    // Swap the orders
    const targetItem = allItems[targetIndex];

    await prisma.$transaction([
      prisma.checklistItem.update({
        where: { id: currentItem.id },
        data: { order: targetItem.order },
      }),
      prisma.checklistItem.update({
        where: { id: targetItem.id },
        data: { order: currentItem.order },
      }),
    ]);

    return NextResponse.json({
      message: "Items reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering template items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
