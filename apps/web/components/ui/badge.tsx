import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeProps = React.ComponentPropsWithoutRef<"div"> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  success: "bg-green-100 text-green-700 border border-green-200/50",
  warning: "bg-amber-100 text-amber-700 border border-amber-200/50",
} as const

const Badge = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & { variant?: keyof typeof variants }
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      (variants as Record<string, string>)[variant ?? "default"],
      className
    )}
    {...props}
  />
))
Badge.displayName = "Badge"

export { Badge }
