import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendAccountSetupEmail } from "@/lib/email"
import { createAuditLog } from "@/lib/audit"
import { generateResetToken } from "@/lib/utils"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId

    if (!areaId) {
      return NextResponse.json({ error: "Area not found" }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: { areaId },
      include: {
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

    if (!session || session.user.role !== "MINI_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const areaId = session.user.areaId
    const organizationId = session.user.organizationId

    if (!areaId || !organizationId) {
      return NextResponse.json({ error: "Area or organization not found" }, { status: 400 })
    }

    const { name, email, role, departmentId, password } = await request.json()

    let newDepartmentId = departmentId || null
    if (role === "MINI_ADMIN") {
      newDepartmentId = null
    }

    // Check if email already exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Verify department belongs to the area
    if (newDepartmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: newDepartmentId,
          areaId,
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
          areaId,
          departmentId: newDepartmentId,
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