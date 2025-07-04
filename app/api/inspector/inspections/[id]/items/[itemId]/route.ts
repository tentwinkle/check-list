import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || !["INSPECTOR", "MINI_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify inspection belongs to inspector
    const inspection = await prisma.inspectionInstance.findFirst({
      where: {
        id: params.id,
      },
      include: {
        report: true,
        department: true,
      },
    })

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSPECTOR" &&
      session.user.departmentId !== inspection.departmentId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (
      session.user.role === "MINI_ADMIN" &&
      session.user.areaId !== inspection.department.areaId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (inspection.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot modify completed inspection" }, { status: 400 })
    }

    const formData = await request.formData()
    const approved = formData.get("approved") === "true"
    const comments = formData.get("comments") as string | null
    const imageFile = formData.get("image") as File | null

    let imageUrl: string | null = null

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop()
      const fileName = `${params.id}-${params.itemId}-${Date.now()}.${fileExt}`
      const filePath = `inspection-images/${fileName}`

      const { data, error } = await supabase.storage.from("inspection-files").upload(filePath, imageFile)

      if (error) {
        console.error("Error uploading image:", error)
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("inspection-files").getPublicUrl(filePath)
      imageUrl = publicUrl
    }

    // Create or get inspection report
    let report = inspection.report
    if (!report) {
      report = await prisma.inspectionReport.create({
        data: {
          inspectionInstanceId: inspection.id,
        },
      })
    }

    // Create or update report item result
    const existingResult = await prisma.reportItemResult.findUnique({
      where: {
        checklistItemId_inspectionReportId: {
          checklistItemId: params.itemId,
          inspectionReportId: report.id,
        },
      },
    })

    if (existingResult) {
      await prisma.reportItemResult.update({
        where: { id: existingResult.id },
        data: {
          approved,
          comments,
          imageUrl: imageUrl || existingResult.imageUrl,
        },
      })
    } else {
      await prisma.reportItemResult.create({
        data: {
          checklistItemId: params.itemId,
          inspectionReportId: report.id,
          approved,
          comments,
          imageUrl,
        },
      })
    }

    // Update inspection status to IN_PROGRESS if it's still PENDING
    if (inspection.status === "PENDING") {
      await prisma.inspectionInstance.update({
        where: { id: inspection.id },
        data: { status: "IN_PROGRESS", inspectorId: session.user.id },
      })
    } else if (inspection.inspectorId !== session.user.id) {
      await prisma.inspectionInstance.update({
        where: { id: inspection.id },
        data: { inspectorId: session.user.id },
      })
    }

    const result = await prisma.reportItemResult.findUnique({
      where: {
        checklistItemId_inspectionReportId: {
          checklistItemId: params.itemId,
          inspectionReportId: report.id,
        },
      },
      select: { imageUrl: true },
    })

    return NextResponse.json({
      message: "Item result saved successfully",
      result,
    })
  } catch (error) {
    console.error("Error saving item result:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";