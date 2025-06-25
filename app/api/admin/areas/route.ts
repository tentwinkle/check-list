import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"
import { sendAccountSetupEmail } from "@/lib/email"
import { generateResetToken } from "@/lib/utils"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const areas = await prisma.area.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(areas)
  } catch (error) {
    console.error("Error fetching areas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const { areaName, areaDescription, leaderName, leaderEmail } = await request.json()

    let existingUser = null
    if (leaderEmail) {
      // Check if email already exists (case-insensitive)
      existingUser = await prisma.user.findFirst({
        where: { email: { equals: leaderEmail, mode: "insensitive" } },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    // Create area and leader user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create area
      const area = await tx.area.create({
        data: {
          name: areaName,
          description: areaDescription,
          organizationId,
        },
      })
      let leaderUser = null
      let resetToken: string | null = null

      if (leaderEmail) {
        // Generate temporary password and reset token
        const tempPassword = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(tempPassword, 12)
        resetToken = generateResetToken()

        // Create area leader
        leaderUser = await tx.user.create({
          data: {
            name: leaderName,
            email: leaderEmail,
            password: hashedPassword,
            role: "MINI_ADMIN",
            organizationId,
            areaId: area.id,
          },
        })

        // Store reset token
        await tx.verificationToken.create({
          data: {
            identifier: leaderEmail,
            token: resetToken,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        })
      }

      return { area, leaderUser, resetToken }
    })

    // Get organization name for email
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    })

    // Send account setup email if leader was created
    if (leaderEmail && result.resetToken) {
      await sendAccountSetupEmail(
        leaderEmail,
        leaderName,
        "Area Leader",
        organization?.name || "Organization",
        result.resetToken,
      )
    }

    return NextResponse.json({
      message: "Area created successfully",
      area: result.area,
    })
  } catch (error) {
    console.error("Error creating area:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
