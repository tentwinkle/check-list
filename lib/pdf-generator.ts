import { jsPDF } from "jspdf"
import fs from "node:fs"
import path from "node:path"

interface ReportData {
  reportId: string
  inspectionInstance: {
    id: string
    createdAt: string
    dueDate: string
    completedAt: string
    masterTemplate: {
      name: string
      description?: string
    }
    inspector: {
      name?: string
      email: string
    }
    department: {
      name: string
      area?: {
        name: string
      }
    }
  }
  reportItems: Array<{
    checklistItem: {
      id: string
      name: string
      description?: string
      location?: string
    }
    approved: boolean
    comments?: string
    imageUrl?: string
  }>
}

export async function generateInspectionPDF(reportData: ReportData): Promise<Uint8Array> {
  const doc = new jsPDF()
  let yPosition = 20
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20

  const checkNewPage = (space = 10) => {
    if (yPosition + space > pageHeight - 30) {
      doc.addPage()
      yPosition = margin
    }
  }

  const start = new Date(reportData.inspectionInstance.createdAt)
  const end = new Date(reportData.inspectionInstance.completedAt)
  const dateStr = start.toLocaleDateString("da-DK")
  const startStr = start.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const endStr = end.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const durationMs = end.getTime() - start.getTime()
  const durationMin = Math.max(0, Math.round(durationMs / 60000))
  const durationStr = `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`

  const location = reportData.inspectionInstance.department.area
    ? `${reportData.inspectionInstance.department.name} - ${reportData.inspectionInstance.department.area.name}`
    : reportData.inspectionInstance.department.name

  const inspectorName =
    reportData.inspectionInstance.inspector.name || reportData.inspectionInstance.inspector.email

  // Header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("REPORT", margin, yPosition)
  doc.setFontSize(14)
  doc.setFont("helvetica", "normal")
  doc.text(reportData.inspectionInstance.masterTemplate.name, margin, yPosition + 8)

  try {
    const logoPath = path.join(process.cwd(), "public", "placeholder-logo.png")
    const logoData = fs.readFileSync(logoPath)
    const base64 = logoData.toString("base64")
    doc.addImage(base64, "PNG", pageWidth - margin - 30, yPosition - 5, 30, 15)
  } catch {
    // ignore if logo is missing
  }

  yPosition += 25
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
  yPosition += 5

  // Metadata
  const meta: Array<[string, string]> = [
    ["Report ID", reportData.reportId],
    ["Date", dateStr],
    ["Start Time", startStr],
    ["End Time", endStr],
    ["Duration", durationStr],
    ["Location", location],
    ["Inspector", inspectorName],
  ]

  doc.setFontSize(10)
  meta.forEach(([label, value]) => {
    checkNewPage(6)
    doc.setFont("helvetica", "bold")
    doc.text(`${label}:`, margin, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(value, margin + 40, yPosition)
    yPosition += 6
  })

  yPosition += 10
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("INSPECTION OVERVIEW", margin, yPosition)
  yPosition += 10

  const colWidths = [10, 25, 15, 50, 25, 20, 35]
  const headers = ["No", "ID", "Image", "Description", "Location", "Status", "Note"]
  const colX: number[] = []
  let pos = margin
  colWidths.forEach((w) => {
    colX.push(pos)
    pos += w
  })

  doc.setFillColor(66, 139, 202)
  doc.setTextColor(255, 255, 255)
  doc.rect(margin, yPosition - 5, pos - margin, 8, "F")
  headers.forEach((h, i) => {
    doc.text(h, colX[i] + 1, yPosition)
  })
  doc.setTextColor(0, 0, 0)
  yPosition += 8

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  reportData.reportItems.forEach((item, idx) => {
    checkNewPage(8)
    const statusIcon = item.approved ? "✓" : "✗"
    const statusColor = item.approved ? [0, 128, 0] : [255, 0, 0]

    doc.text(String(idx + 1), colX[0] + 1, yPosition)
    doc.text(item.checklistItem.id.slice(0, 8), colX[1] + 1, yPosition)
    doc.text(item.imageUrl ? "true" : "false", colX[2] + 1, yPosition)
    doc.text(item.checklistItem.name, colX[3] + 1, yPosition)
    doc.text(item.checklistItem.location || "-", colX[4] + 1, yPosition)
    doc.setTextColor(...statusColor)
    doc.text(statusIcon, colX[5] + 1, yPosition)
    doc.setTextColor(0, 0, 0)
    doc.text(item.comments || "-", colX[6] + 1, yPosition)
    yPosition += 6
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const h = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    const footerY = h - 20
    doc.text(
      `This report was completed and submitted by ${inspectorName}. The inspection was carried out in accordance with the applicable regulations and guidelines for fire safety equipment, and the information provided in this report is given under full responsibility.`,
      margin,
      footerY,
      { maxWidth: pageWidth - 2 * margin }
    )
    doc.text(`Digitally finalized: ${dateStr}`, margin, footerY + 8)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, footerY + 8)
  }

  return doc.output("arraybuffer") as Uint8Array
}

export function generatePDFFilename(
  templateName: string,
  departmentName: string,
  areaName: string | undefined,
  completedDate: string,
): string {
  const date = new Date(completedDate).toISOString().split("T")[0]

  // Sanitize names for filename (remove special characters, convert to lowercase)
  const sanitizeForFilename = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[æ]/g, "ae")
      .replace(/[ø]/g, "oe")
      .replace(/[å]/g, "aa")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
  }

  const sanitizedArea = areaName ? sanitizeForFilename(areaName) : "unknown_area"
  const sanitizedTemplate = sanitizeForFilename(templateName)

  // Format: area_template_YYYY-MM-DD.pdf (e.g., teglstenen_vehicles_2025-06-01.pdf)
  return `${sanitizedArea}_${sanitizedTemplate}_${date}.pdf`
}
