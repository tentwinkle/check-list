import { jsPDF } from "jspdf"

interface ReportData {
  inspectionInstance: {
    id: string
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
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width
  const margin = 20

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace = 10) => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      doc.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return lines.length * (fontSize * 0.4) // Return height used
  }

  // Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("INSPECTION REPORT", margin, yPosition)
  yPosition += 20

  // Draw header line
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
  yPosition += 10

  // Inspection Details
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("INSPECTION DETAILS", margin, yPosition)
  yPosition += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const completedDate = new Date(reportData.inspectionInstance.completedAt)
  const dueDate = new Date(reportData.inspectionInstance.dueDate)

  // Format dates in Danish format
  const completedDateStr = completedDate.toLocaleDateString("da-DK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  const dueDateStr = dueDate.toLocaleDateString("da-DK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  // Basic Information
  const details = [
    `Template: ${reportData.inspectionInstance.masterTemplate.name}`,
    `Inspector: ${reportData.inspectionInstance.inspector.name || reportData.inspectionInstance.inspector.email}`,
    `Department: ${reportData.inspectionInstance.department.name}`,
    ...(reportData.inspectionInstance.department.area
      ? [`Area: ${reportData.inspectionInstance.department.area.name}`]
      : []),
    `Due Date: ${dueDateStr}`,
    `Completed: ${completedDateStr}`,
  ]

  details.forEach((detail) => {
    checkNewPage()
    doc.text(detail, margin, yPosition)
    yPosition += 6
  })

  yPosition += 10

  // Summary Section
  checkNewPage(30)
  const approvedCount = reportData.reportItems.filter((item) => item.approved).length
  const totalCount = reportData.reportItems.length
  const notApprovedCount = totalCount - approvedCount

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("SUMMARY", margin, yPosition)
  yPosition += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  // Summary box
  const summaryBoxHeight = 25
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(248, 249, 250)
  doc.rect(margin, yPosition, pageWidth - 2 * margin, summaryBoxHeight, "FD")

  yPosition += 8
  doc.setTextColor(0, 128, 0) // Green
  doc.text(`✓ Approved: ${approvedCount}`, margin + 10, yPosition)
  yPosition += 6

  if (notApprovedCount > 0) {
    doc.setTextColor(255, 0, 0) // Red
    doc.text(`✗ Not Approved: ${notApprovedCount}`, margin + 10, yPosition)
    yPosition += 6
  }

  doc.setTextColor(0, 0, 0) // Reset to black
  doc.text(`Total Items: ${totalCount}`, margin + 10, yPosition)
  yPosition += 15

  // Checklist Results Section
  checkNewPage(40)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("CHECKLIST RESULTS", margin, yPosition)
  yPosition += 15

  // Table header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setFillColor(66, 139, 202)
  doc.setTextColor(255, 255, 255)
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F")

  const colWidths = [15, 60, 40, 30, 45]
  const colPositions = [margin + 2, margin + 17, margin + 77, margin + 117, margin + 147]
  const headers = ["#", "Item", "Location", "Status", "Comments"]

  headers.forEach((header, index) => {
    doc.text(header, colPositions[index], yPosition)
  })

  yPosition += 10
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")

  // Table rows
  reportData.reportItems.forEach((item, index) => {
    checkNewPage(15)

    const rowHeight = 12
    const statusText = item.approved ? "✓ APPROVED" : "✗ NOT APPROVED"
    const location = item.checklistItem.location || "-"
    const comments = item.comments || "-"

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250)
      doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, rowHeight, "F")
    }

    // Row data
    doc.text((index + 1).toString(), colPositions[0], yPosition + 3)

    // Item name (with wrapping)
    const itemLines = doc.splitTextToSize(item.checklistItem.name, colWidths[1] - 5)
    doc.text(itemLines[0], colPositions[1], yPosition + 3)

    // Location
    const locationLines = doc.splitTextToSize(location, colWidths[2] - 5)
    doc.text(locationLines[0], colPositions[2], yPosition + 3)

    // Status (with color)
    if (item.approved) {
      doc.setTextColor(0, 128, 0)
    } else {
      doc.setTextColor(255, 0, 0)
    }
    doc.text(statusText, colPositions[3], yPosition + 3)
    doc.setTextColor(0, 0, 0)

    // Comments
    const commentLines = doc.splitTextToSize(comments, colWidths[4] - 5)
    doc.text(commentLines[0], colPositions[4], yPosition + 3)

    yPosition += rowHeight
  })

  // Detailed Comments Section
  const itemsWithComments = reportData.reportItems.filter((item) => item.comments && item.comments.trim().length > 0)

  if (itemsWithComments.length > 0) {
    yPosition += 20
    checkNewPage(30)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("DETAILED COMMENTS", margin, yPosition)
    yPosition += 15

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)

    itemsWithComments.forEach((item, index) => {
      checkNewPage(25)

      const statusIcon = item.approved ? "✓" : "✗"
      const statusColor = item.approved ? [0, 128, 0] : [255, 0, 0]

      // Item header
      doc.setTextColor(...statusColor)
      doc.setFont("helvetica", "bold")
      doc.text(`${statusIcon} ${item.checklistItem.name}`, margin, yPosition)
      yPosition += 8

      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")

      if (item.checklistItem.location) {
        doc.text(`Location: ${item.checklistItem.location}`, margin + 5, yPosition)
        yPosition += 6
      }

      // Comments with wrapping
      const commentHeight = addWrappedText(
        `Comments: ${item.comments}`,
        margin + 5,
        yPosition,
        pageWidth - 2 * margin - 10,
      )
      yPosition += commentHeight + 8

      // Separator line
      if (index < itemsWithComments.length - 1) {
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 5
      }
    })
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)

    // Footer line
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)

    // Footer text
    doc.text(
      `Generated: ${new Date().toLocaleString("da-DK")} | Inspection ID: ${reportData.inspectionInstance.id.substring(0, 8)}...`,
      margin,
      pageHeight - 12,
    )

    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pageHeight - 12)
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
