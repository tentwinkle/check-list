import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "completed" | "due-soon" | "overdue" | "pending"
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const statusConfig = {
    completed: {
      label: "Completed",
      icon: CheckCircle,
      className:
        "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200",
    },
    "due-soon": {
      label: "Due Soon",
      icon: AlertTriangle,
      className:
        "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 shadow-sm hover:shadow-md transition-all duration-200",
    },
    overdue: {
      label: "Overdue",
      icon: AlertTriangle,
      className:
        "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200 shadow-sm hover:shadow-md transition-all duration-200",
    },
    pending: {
      label: "Pending",
      icon: Calendar,
      className:
        "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-3 py-1.5 rounded-full font-medium text-xs flex items-center gap-1.5 border-2",
        config.className,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  )
}
