import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"
import { sendAccountSetupEmail } from "@/lib/email"
import { createAuditLog } from "@/lib/audit"
import { generateResetToken } from "@/lib/utils"
import bcrypt from "bcryptjs"
import { extractOrganizationId } from "@/lib/admin"

export async function GET(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = extractOrganizationId(session, request)

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: { organizationId },
      include: {
        area: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = extractOrganizationId(session, request)

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const { name, email, role, areaId, departmentId, password } = await request.json()

    // Check if email already exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Verify area and department belong to the organization
    if (areaId && areaId !== "NONE" && areaId !== "") {
      const area = await prisma.area.findFirst({
        where: {
          id: areaId,
          organizationId,
        },
      })

      if (!area) {
        return NextResponse.json({ error: "Invalid area" }, { status: 400 })
      }
    }

    if (departmentId && departmentId !== "NONE" && departmentId !== "") {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId,
        },
      })

      if (!department) {
        return NextResponse.json({ error: "Invalid department" }, { status: 400 })
      }
    }

    // Create user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let hashedPassword: string
      let resetToken: string | null = null

      if (password) {
        hashedPassword = await bcrypt.hash(password, 12)
      } else {
        const tempPassword = Math.random().toString(36).slice(-8)
        hashedPassword = await bcrypt.hash(tempPassword, 12)
        resetToken = generateResetToken()
      }

      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as any,
          organizationId,
          areaId: areaId === "NONE" || areaId === "" ? null : areaId,
          departmentId: departmentId === "NONE" || departmentId === "" ? null : departmentId,
        },
      })

      if (resetToken) {
        await tx.verificationToken.create({
          data: {
            identifier: email,
            token: resetToken,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        })
      }

      return { user, resetToken }
    })

    // Get organization name for email
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    })

    // Send account setup email
    if (result.resetToken) {
      await sendAccountSetupEmail(
        email,
        name,
        role,
        organization?.name || "Organization",
        result.resetToken,
      )
    }

    await createAuditLog(session.user.id, "CREATE_USER", "User", result.user.id)

    return NextResponse.json({
      message: "User created successfully",
      user: result.user,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";