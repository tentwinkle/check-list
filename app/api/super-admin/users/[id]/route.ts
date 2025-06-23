import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmailUpdateNotification } from "@/lib/email"
import { generateResetToken } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, role: true, organizationId: true },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email } = await request.json()

    const existingUser = await prisma.user.findUnique({ where: { id: params.id } })

    if (!existingUser || existingUser.role !== "ADMIN") {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          id: { not: params.id },
        },
      })

      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    const emailChanged = email && email !== existingUser.email

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
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
      await prisma.session.deleteMany({ where: { userId: params.id } })
      await sendEmailUpdateNotification(email, resetToken)
    }

    return NextResponse.json({ message: "User updated successfully", user })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
