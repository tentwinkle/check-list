import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800",
        secondary:
          "border-transparent bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 shadow-sm hover:shadow-md",
        destructive:
          "border-transparent bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:shadow-lg hover:from-red-700 hover:to-red-800",
        outline: "text-foreground border-2 bg-white/80 backdrop-blur-sm hover:bg-gray-50 shadow-sm hover:shadow-md",
        success:
          "border-transparent bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800",
        warning:
          "border-transparent bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md hover:shadow-lg hover:from-amber-700 hover:to-amber-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
