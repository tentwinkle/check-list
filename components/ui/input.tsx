import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    variant?: "default" | "glass"
  }
>(({ className, type, variant = "default", ...props }, ref) => {
  const variants = {
    default:
      "flex h-11 w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:shadow-lg focus-visible:shadow-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-in-out hover:border-gray-300",
    glass:
      "flex h-11 w-full rounded-xl glass px-4 py-2.5 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:shadow-lg focus-visible:shadow-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-in-out",
  }

  return <input type={type} className={cn(variants[variant], className)} ref={ref} {...props} />
})
Input.displayName = "Input"

export { Input }
