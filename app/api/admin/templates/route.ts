import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const userDepartmentId = session.user.departmentId;

    const templates = await prisma.masterTemplate.findMany({
      where: {
        organizationId,
        ...(userDepartmentId ? { departmentId: userDepartmentId } : {}),
      },
      include: {
        department: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            checklistItems: true,
            inspections: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const { name, description, frequency, departmentId } = await request.json();

    const userDepartmentId = session.user.departmentId;
    let finalDepartmentId: string | null = null;

    if (userDepartmentId) {
      if (departmentId && departmentId !== userDepartmentId) {
        return NextResponse.json(
          { error: "Invalid department" },
          { status: 400 },
        );
      }
      finalDepartmentId = userDepartmentId;
    } else if (departmentId && departmentId !== "none" && departmentId !== "") {
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
      finalDepartmentId = departmentId;
    }

    const template = await prisma.masterTemplate.create({
      data: {
        name,
        description,
        frequency,
        organizationId,
        departmentId: finalDepartmentId,
      },
    });

    await createAuditLog(
      session.user.id,
      "CREATE_TEMPLATE",
      "Template",
      template.id,
    );

    return NextResponse.json({
      message: "Template created successfully",
      template,
    });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
