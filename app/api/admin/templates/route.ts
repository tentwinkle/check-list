import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { extractOrganizationId } from "@/lib/admin";

export async function GET(request: NextRequest) {
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

    const templates = await prisma.masterTemplate.findMany({
      where: {
        organizationId,
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

    const template = await prisma.masterTemplate.create({
      data: {
        name,
        description,
        frequency,
        organizationId,
        departmentId
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
