export type InspectionStatusType = "completed" | "overdue" | "due-soon" | "pending"

export interface InspectionStatusInfo {
  status: InspectionStatusType
  color: string
  label: string
  daysUntilDue?: number
  daysOverdue?: number
}

export function getInspectionStatus(dueDate: Date, completedAt?: Date | null, bufferDays = 3): InspectionStatusInfo {
  const now = new Date()
  const due = new Date(dueDate)

  // If completed, always show as completed
  if (completedAt) {
    return {
      status: "completed",
      color: "green",
      label: "Completed",
    }
  }

  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    // Overdue
    return {
      status: "overdue",
      color: "red",
      label: "Overdue",
      daysOverdue: Math.abs(diffDays),
    }
  } else if (diffDays <= bufferDays) {
    // Due soon
    return {
      status: "due-soon",
      color: "orange",
      label: "Due Soon",
      daysUntilDue: diffDays,
    }
  } else {
    // Pending
    return {
      status: "pending",
      color: "blue",
      label: "Pending",
      daysUntilDue: diffDays,
    }
  }
}

export function getStatusBadgeProps(statusInfo: InspectionStatusInfo) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

  switch (statusInfo.status) {
    case "completed":
      return {
        className: `${baseClasses} bg-green-100 text-green-800`,
        children: "✅ Completed",
      }
    case "overdue":
      return {
        className: `${baseClasses} bg-red-100 text-red-800`,
        children: `🔴 Overdue (${statusInfo.daysOverdue} days)`,
      }
    case "due-soon":
      return {
        className: `${baseClasses} bg-orange-100 text-orange-800`,
        children: `🟧 Due in ${statusInfo.daysUntilDue} days`,
      }
    case "pending":
      return {
        className: `${baseClasses} bg-blue-100 text-blue-800`,
        children: `📋 Due in ${statusInfo.daysUntilDue} days`,
      }
    default:
      return {
        className: `${baseClasses} bg-gray-100 text-gray-800`,
        children: "Unknown",
      }
  }
}
