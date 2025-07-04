import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { extractOrganizationId } from "@/lib/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = extractOrganizationId(session, request);

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const userDepartmentId = session.user.departmentId;

    // Verify template belongs to organization (and department if restricted)
    const template = await prisma.masterTemplate.findFirst({
      where: {
        id: params.id,
        organizationId,
        ...(userDepartmentId ? { departmentId: userDepartmentId } : {}),
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = extractOrganizationId(session, request);

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const { name, description, frequency, departmentId } = await request.json();

    // Verify template belongs to organization
    const userDepartmentId = session.user.departmentId;

    const existingTemplate = await prisma.masterTemplate.findFirst({
      where: {
        id: params.id,
        organizationId,
        ...(userDepartmentId ? { departmentId: userDepartmentId } : {}),
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Verify department belongs to organization if provided
    if (userDepartmentId) {
      if (departmentId && departmentId !== userDepartmentId) {
        return NextResponse.json(
          { error: "Invalid department" },
          { status: 400 },
        );
      }
    } else if (departmentId && departmentId !== "none") {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId,
        },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Invalid department" },
          { status: 400 },
        );
      }
    }

    let finalDepartmentId: string | null = existingTemplate.departmentId;

    if (userDepartmentId) {
      finalDepartmentId = userDepartmentId;
    } else if (departmentId && departmentId !== "none") {
      finalDepartmentId = departmentId;
    } else if (departmentId === "none") {
      finalDepartmentId = null;
    }

    const template = await prisma.masterTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description,
        frequency,
        departmentId: finalDepartmentId,
      },
    });

    await createAuditLog(
      session.user.id,
      "UPDATE_TEMPLATE",
      "Template",
      params.id,
    );

    return NextResponse.json({
      message: "Template updated successfully",
      template,
    });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const userDepartmentId = session.user.departmentId;

    // Verify template belongs to organization (and department if restricted)
    const existingTemplate = await prisma.masterTemplate.findFirst({
      where: {
        id: params.id,
        organizationId,
        ...(userDepartmentId ? { departmentId: userDepartmentId } : {}),
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    await prisma.masterTemplate.delete({
      where: { id: params.id },
    });

    await createAuditLog(
      session.user.id,
      "DELETE_TEMPLATE",
      "Template",
      params.id,
    );

    return NextResponse.json({
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
