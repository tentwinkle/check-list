import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"
import { generateInspectionPDF, generatePDFFilename } from "@/lib/pdf-generator"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session: Session | null = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the inspection with all related data
    const inspection = await prisma.inspectionInstance.findUnique({
      where: {
        id: params.id,
        department: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        masterTemplate: true,
        inspector: true,
        department: {
          include: {
            area: true,
          },
        },
        report: {
          include: {
            reportItems: {
              include: {
                checklistItem: true,
              },
              orderBy: {
                checklistItem: {
                  order: "asc",
                },
              },
            },
          },
        },
      },
    })

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 })
    }

    if (!inspection.report) {
      return NextResponse.json({ error: "Inspection report not found" }, { status: 404 })
    }

    if (inspection.status !== "COMPLETED") {
      return NextResponse.json({ error: "Inspection must be completed before generating PDF" }, { status: 400 })
    }

    // Generate PDF
    const pdfBuffer = await generateInspectionPDF({
      reportId: inspection.report.id,
      inspectionInstance: {
        id: inspection.id,
        createdAt: inspection.createdAt.toISOString(),
        dueDate: inspection.dueDate.toISOString(),
        completedAt: inspection.completedAt?.toISOString() || new Date().toISOString(),
        masterTemplate: {
          name: inspection.masterTemplate.name,
          description: inspection.masterTemplate.description,
        },
        inspector: {
          name: inspection.inspector.name,
          email: inspection.inspector.email,
        },
        department: {
          name: inspection.department.name,
          area: inspection.department.area
            ? {
                name: inspection.department.area.name,
              }
            : undefined,
        },
      },
      reportItems: inspection.report.reportItems.map((item) => ({
        checklistItem: {
          id: item.checklistItem.id,
          name: item.checklistItem.name,
          description: item.checklistItem.description,
          location: item.checklistItem.location,
        },
        approved: item.approved,
        comments: item.comments,
        imageUrl: item.imageUrl,
      })),
    })

    const filename = generatePDFFilename(
      inspection.masterTemplate.name,
      inspection.department.name,
      inspection.department.area?.name,
      inspection.completedAt?.toISOString() || new Date().toISOString(),
    )

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
