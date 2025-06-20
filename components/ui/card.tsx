import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "elevated"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "rounded-xl border bg-card text-card-foreground shadow-modern",
    glass: "glass-card text-card-foreground",
    elevated:
      "rounded-xl bg-card text-card-foreground shadow-modern-lg hover:shadow-modern-xl transition-all duration-300 hover:-translate-y-1",
  }

  return (
    <div ref={ref} className={cn("transition-all duration-300 ease-in-out", variants[variant], className)} {...props} />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-2 p-4 sm:p-6", className)} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizes = {
    sm: "text-lg font-semibold",
    md: "text-xl sm:text-2xl font-semibold",
    lg: "text-2xl sm:text-3xl font-bold",
  }

  return (
    <div
      ref={ref}
      className={cn("leading-none tracking-tight text-gray-900 dark:text-gray-100", sizes[size], className)}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm sm:text-base text-muted-foreground leading-relaxed", className)} {...props} />
  ),
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />,
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-4 sm:p-6 pt-0", className)} {...props} />
  ),
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
