import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()
    const fileName = `${session.user.id}-${Date.now()}.${ext}`
    const filePath = `profile-images/${fileName}`

    const { error } = await supabase.storage
      .from("profile-files")
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.error("Error uploading profile image:", error)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-files").getPublicUrl(filePath)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: publicUrl },
      select: { id: true, name: true, email: true, role: true, image: true },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile image:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
