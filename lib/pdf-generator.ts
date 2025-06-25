import { jsPDF } from "jspdf";
import fs from "node:fs";
import path from "node:path";

interface ReportData {
  reportId: string;
  inspectionInstance: {
    id: string;
    createdAt: string;
    dueDate: string;
    completedAt: string;
    masterTemplate: {
      name: string;
      description?: string;
    };
    inspector: {
      name?: string;
      email: string;
    };
    department: {
      name: string;
      area?: {
        name: string;
      };
    };
  };
  reportItems: Array<{
    checklistItem: {
      id: string;
      name: string;
      description?: string;
      location?: string;
    };
    approved: boolean;
    comments?: string;
    imageUrl?: string;
  }>;
}

export async function generateInspectionPDF(
  reportData: ReportData
): Promise<Uint8Array> {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  const checkNewPage = (space = 10) => {
    if (yPosition + space > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }
  };

  const wrapText = (text: string, maxWidth: number): string[] => {
    return doc.splitTextToSize(text, maxWidth);
  };

  const start = new Date(reportData.inspectionInstance.createdAt);
  const end = new Date(reportData.inspectionInstance.completedAt);
  const dateStr = start.toLocaleDateString("da-DK");
  const startStr = start.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endStr = end.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const durationMs = end.getTime() - start.getTime();
  const durationMin = Math.max(0, Math.round(durationMs / 60000));
  const durationStr =
    durationMin < 60
      ? `${durationMin} minutes`
      : `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`;

  const location = reportData.inspectionInstance.department.area
    ? `${reportData.inspectionInstance.department.name} - ${reportData.inspectionInstance.department.area.name}`
    : reportData.inspectionInstance.department.name;

  const inspectorName =
    reportData.inspectionInstance.inspector.name ||
    reportData.inspectionInstance.inspector.email;

  // ─────────────── HEADER ───────────────
  const logoHeight = 35;
  const textBlockHeight = 30;
  const headerHeight = Math.max(logoHeight, textBlockHeight);
  const logoWidth = 62;
  const headerTopY = yPosition;
  const centerY = headerTopY + headerHeight / 2;

  // Left-aligned header text
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("REPORT", margin, centerY - 7);

  doc.setFontSize(24);
  doc.setFont("helvetica", "normal");
  doc.text(
    reportData.inspectionInstance.masterTemplate.name,
    margin,
    centerY + 4
  );

  // Right-aligned, vertically centered logo
  try {
    const logoPath = path.join(process.cwd(), "public", "report-logo.png");
    const logoData = fs.readFileSync(logoPath);
    const base64 = logoData.toString("base64");
    const logoX = pageWidth - margin - logoWidth;
    const logoY = centerY - logoHeight / 2;
    doc.addImage(base64, "PNG", logoX, logoY, logoWidth, logoHeight);
  } catch {
    // ignore if logo is missing
  }

  yPosition += headerHeight + 5;

  // ─────────────── METADATA ───────────────
  const meta: Array<[string, string]> = [
    ["Report ID", reportData.reportId],
    ["Date", dateStr],
    ["Start Time", startStr],
    ["End Time", endStr],
    ["Duration", durationStr],
    ["Location", location],
    ["Inspector", inspectorName],
  ];

  doc.setFontSize(12);
  const col1X = margin;
  const col2X = pageWidth / 2;
  const lineHeight = 10;

  for (let i = 0; i < meta.length; i += 2) {
    checkNewPage(lineHeight);
    const [label1, value1] = meta[i];
    const [label2, value2] = meta[i + 1] || ["", ""];

    doc.setFont("helvetica", "bold");
    doc.text(`${label1}:`, col1X, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(value1, col1X + 25, yPosition);

    if (label2) {
      doc.setFont("helvetica", "bold");
      doc.text(`${label2}:`, col2X, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value2, col2X + 25, yPosition);
    }

    yPosition += lineHeight;
  }

  yPosition += 13;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("INSPECTION OVERVIEW", margin, yPosition);
  yPosition += 6;

  // ─────────────── TABLE HEADERS ───────────────
  const colWidths = [10, 25, 15, 50, 25, 20, 35];
  const headers = [
    "No",
    "ID",
    "Image",
    "Description",
    "Location",
    "Status",
    "Note",
  ];
  const colX: number[] = [];
  let pos = margin;
  colWidths.forEach((w) => {
    colX.push(pos);
    pos += w;
  });

  const tableheaderHeight = 8;
  const headerY = yPosition;

  doc.setFillColor(66, 139, 202);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  // Draw background
  doc.rect(margin, headerY, pos - margin, tableheaderHeight, "F");

  // Draw text slightly lower to align vertically within the 8pt height
  const headerTextY = headerY + 5.5;

  headers.forEach((h, i) => {
    doc.text(h, colX[i] + 1, headerTextY);
  });

  doc.setTextColor(0, 0, 0);

  // Move yPosition directly to first row start
  yPosition = headerY + tableheaderHeight;

  // ─────────────── TABLE BODY ───────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const checkIcon = fs
    .readFileSync(path.join("public", "check.png"))
    .toString("base64");
  const crossIcon = fs
    .readFileSync(path.join("public", "cross.png"))
    .toString("base64");

  reportData.reportItems.forEach((item, idx) => {
    const wrappedDesc = wrapText(item.checklistItem.name, colWidths[3] - 2);
    const wrappedNote = wrapText(item.comments || "-", colWidths[6] - 2);
    const lineCount = Math.max(wrappedDesc.length, wrappedNote.length);
    const rowHeight = Math.max(8, lineCount * 5); // Min 8 for short entries

    checkNewPage(rowHeight);

    const isEven = idx % 2 === 1;
    if (isEven) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, rowHeight, "F");
    }

    const statusIcon = item.approved ? checkIcon : crossIcon;
    const iconSize = 4;
    const centerY = yPosition + rowHeight / 2 + iconSize / 4; // Adjust center

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Draw all cell contents vertically centered in row
    doc.text(String(idx + 1), colX[0] + 1, centerY);
    doc.text(item.checklistItem.id.slice(0, 8), colX[1] + 1, centerY);
    doc.text(item.imageUrl ? "Ja" : "Nej", colX[2] + 1, centerY);
    doc.text(wrappedDesc.join(" "), colX[3] + 1, centerY);
    doc.text(item.checklistItem.location || "-", colX[4] + 1, centerY);
    doc.addImage(
      statusIcon,
      "PNG",
      colX[5] + 1,
      centerY - iconSize + 2,
      iconSize,
      iconSize
    );
    doc.text(item.comments || "-", colX[6] + 1, centerY);

    yPosition += rowHeight;
  });

  // ─────────────── FOOTER / STATEMENT ───────────────
  yPosition += 20;
  const closingStatement = `This report was completed and submitted by ${inspectorName}. The inspection was carried out in accordance with the applicable regulations and guidelines for fire safety equipment, and the information provided in this report is given under full responsibility.`;
  const wrapped = doc.splitTextToSize(closingStatement, pageWidth - 3 * margin);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(wrapped, margin, yPosition);

  yPosition += wrapped.length * 6 + 4;
  doc.text(`Digitally finalized: ${dateStr} kl. ${endStr}`, margin, yPosition);

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.height;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, h - 12);
  }

  return doc.output("arraybuffer") as Uint8Array;
}

export function generatePDFFilename(
  templateName: string,
  departmentName: string,
  areaName: string | undefined,
  completedDate: string
): string {
  const date = new Date(completedDate).toISOString().split("T")[0];

  const sanitizeForFilename = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[æ]/g, "ae")
      .replace(/[ø]/g, "oe")
      .replace(/[å]/g, "aa")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const sanitizedArea = areaName
    ? sanitizeForFilename(areaName)
    : "unknown_area";
  const sanitizedTemplate = sanitizeForFilename(templateName);

  return `${sanitizedArea}_${sanitizedTemplate}_${date}.pdf`;
}
