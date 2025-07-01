import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmailUpdateNotification } from "@/lib/email"
import { generateResetToken } from "@/lib/utils"
import { createAuditLog } from "@/lib/audit"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const { name, email, role, areaId, departmentId, password } = await request.json()

    // Verify user belongs to organization
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: params.id },
        },
      })

      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    // Verify area and department belong to organization
    if (areaId && areaId !== "NONE") {
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

    if (departmentId && departmentId !== "NONE") {
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

    const emailChanged = email !== existingUser.email

    const roleLevel: Record<string, number> = {
      SUPER_ADMIN: 3,
      ADMIN: 2,
      MINI_ADMIN: 1,
      INSPECTOR: 0,
    }

    if (roleLevel[existingUser.role] > roleLevel[session.user.role]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: any = {
      name,
      email,
      role: role as any,
      areaId: areaId === "NONE" ? null : areaId,
      departmentId: departmentId === "NONE" ? null : departmentId,
    }
    if (emailChanged) {
      updateData.password = null
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    })

    if (emailChanged) {
      const resetToken = generateResetToken()
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: resetToken,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
      await prisma.session.deleteMany({ where: { userId: params.id } })
      await sendEmailUpdateNotification(email, resetToken)
      await createAuditLog(session.user.id, "UPDATE_USER_EMAIL", "User", params.id)
    } else {
      await createAuditLog(session.user.id, "UPDATE_USER", "User", params.id)
    }

    return NextResponse.json({
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    // Verify user belongs to organization
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting yourself
    if (params.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Check if user has inspections
    const inspectionCount = await prisma.inspectionInstance.count({
      where: { inspectorId: params.id },
    })

    if (inspectionCount > 0) {
      return NextResponse.json({ error: "Cannot delete user with existing inspections" }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    await createAuditLog(session.user.id, "DELETE_USER", "User", params.id)

    return NextResponse.json({
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";