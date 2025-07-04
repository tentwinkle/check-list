import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          where: { role: "ADMIN" },
          select: {
            id: true,
            name: true,
            email: true,
          },
          take: 1,
        },
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

    // Transform the data to include admin info
    const transformedOrganizations = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      description: org.description,
      createdAt: org.createdAt,
      admin: org.users.length > 0 ? org.users[0] : null,
      _count: org._count,
    }))

    return NextResponse.json(transformedOrganizations)
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, adminName, adminEmail, adminPassword } = await request.json()

    if (!name || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Admin email already exists" }, { status: 400 })
    }

    // Hash the admin password
    const bcrypt = require("bcryptjs")
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create organization and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name,
          description,
        },
      })

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

      return { organization, adminUser }
    })

    return NextResponse.json({
      id: result.organization.id,
      name: result.organization.name,
      description: result.organization.description,
      admin: {
        id: result.adminUser.id,
        name: result.adminUser.name,
        email: result.adminUser.email,
      },
    })
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
