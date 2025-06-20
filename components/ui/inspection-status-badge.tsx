import { Badge } from "@/components/ui/badge"
import { getInspectionStatus, getStatusBadgeProps } from "@/lib/inspection-status"

interface InspectionStatusBadgeProps {
  dueDate: Date
  completedAt?: Date | null
  bufferDays?: number
}

export function InspectionStatusBadge({ dueDate, completedAt, bufferDays = 3 }: InspectionStatusBadgeProps) {
  const statusInfo = getInspectionStatus(dueDate, completedAt, bufferDays)
  const badgeProps = getStatusBadgeProps(statusInfo)

  return <Badge className={badgeProps.className}>{badgeProps.children}</Badge>
}
