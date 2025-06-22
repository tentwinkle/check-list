import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendAccountSetupEmail } from "@/lib/email"
import { generateResetToken } from "@/lib/utils"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            areas: true,
            departments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { organizationName, organizationDescription, adminName, adminEmail } = await request.json()

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingUser) {
      return NextResponse.json({ message: "Email already in use" }, { status: 400 })
    }

    // Create organization and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          description: organizationDescription,
        },
      })

      // Generate temporary password and reset token
      const tempPassword = Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(tempPassword, 12)
      const resetToken = generateResetToken()

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
          organizationId: organization.id,
        },
      })

      // Store reset token (you might want to create a separate table for this)
      await tx.verificationToken.create({
        data: {
          identifier: adminEmail,
          token: resetToken,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })

      return { organization, adminUser, resetToken }
    })

    // Send account setup email
    await sendAccountSetupEmail(
      adminEmail,
      adminName,
      "Team Leader",
      organizationName,
      result.resetToken,
    )

    return NextResponse.json({
      message: "Organization created successfully",
      organization: result.organization,
    })
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
