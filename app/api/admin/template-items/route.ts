import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractOrganizationId } from "@/lib/admin";
import { randomBytes } from "crypto";

function generateShortId(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

export async function GET(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    const organizationId = extractOrganizationId(session, request);
    const userDepartmentId = session.user.departmentId;

    const template = await prisma.masterTemplate.findFirst({
      where: {
        id: templateId,
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

    const items = await prisma.checklistItem.findMany({
      where: { masterTemplateId: templateId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching template items:", error);
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

    const { templateId, name, description, location } = await request.json();

    if (!templateId || !name) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const organizationId = extractOrganizationId(session, request);
    const userDepartmentId = session.user.departmentId;

    const template = await prisma.masterTemplate.findFirst({
      where: {
        id: templateId,
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

    const lastItem = await prisma.checklistItem.findFirst({
      where: { masterTemplateId: templateId },
      orderBy: { order: "desc" },
    });

    const nextOrder = (lastItem?.order || 0) + 1;
    const qrCodeId = generateShortId();

    const item = await prisma.checklistItem.create({
      data: {
        name,
        description,
        location,
        order: nextOrder,
        qrCodeId,
        masterTemplateId: templateId,
      },
    });

    return NextResponse.json({
      message: "Template item created successfully",
      item,
    });
  } catch (error) {
    console.error("Error creating template item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
