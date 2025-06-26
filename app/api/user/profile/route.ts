import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmailUpdateNotification } from "@/lib/email"
import { generateResetToken } from "@/lib/utils"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, profileImage } = body

    // Validate input
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: session.user.id,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email is already taken" }, { status: 400 })
    }

    // Update user profile
    const emailChanged = email !== session.user.email
    const updateData: any = {
      name,
      email,
    }

    // Only update profile image if provided
    if (profileImage !== undefined) {
      updateData.image = profileImage
    }
    if (emailChanged) {
      updateData.password = null
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
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
      await prisma.session.deleteMany({ where: { userId: session.user.id } })
      await sendEmailUpdateNotification(email, resetToken)
      await createAuditLog(session.user.id, "UPDATE_EMAIL", "User", session.user.id)
    } else {
      await createAuditLog(session.user.id, "UPDATE_PROFILE", "User", session.user.id)
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";