import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateQRCodeId(): string {
  return crypto.randomBytes(8).toString("hex")
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function getInspectionStatus(dueDate: Date): "completed" | "due-soon" | "overdue" | "pending" {
  const now = new Date()
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "overdue"
  if (diffDays <= 3) return "due-soon"
  return "pending"
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("da-DK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function generatePDFFilename(departmentName: string, templateName: string, date: Date): string {
  const formattedDate = date.toISOString().split("T")[0]
  const sanitizedDept = departmentName.toLowerCase().replace(/\s+/g, "_")
  const sanitizedTemplate = templateName.toLowerCase().replace(/\s+/g, "_")
  return `${sanitizedDept}_${sanitizedTemplate}_${formattedDate}.pdf`
}

export function getDashboardPath(role?: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin"
    case "ADMIN":
      return "/admin"
    case "MINI_ADMIN":
      return "/mini-admin"
    case "INSPECTOR":
      return "/inspector"
    default:
      return "/inspector"
  }
}
