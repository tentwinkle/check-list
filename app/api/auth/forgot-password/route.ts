import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateResetToken } from "@/lib/utils"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Respond with success even if user not found to avoid email enumeration
      return NextResponse.json({ message: "If an account exists, a reset link has been sent" })
    }

    const token = generateResetToken()
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    await sendPasswordResetEmail(email, token)
    return NextResponse.json({ message: "If an account exists, a reset link has been sent" })
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
