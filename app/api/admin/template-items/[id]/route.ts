import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractOrganizationId } from "@/lib/admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = extractOrganizationId(session, request);
    const userDepartmentId = session.user.departmentId;

    // Verify item belongs to organization and department if restricted
    const item = await prisma.checklistItem.findFirst({
      where: {
        id: params.id,
        masterTemplate: {
          organizationId,
          ...(userDepartmentId ? { departmentId: userDepartmentId } : {}),
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Template item not found" },
        { status: 404 },
      );
    }

    // Check if item has report results
    const reportCount = await prisma.reportItemResult.count({
      where: { checklistItemId: params.id },
    });

    if (reportCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete item with existing inspection results" },
        { status: 400 },
      );
    }

    await prisma.checklistItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Template item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
