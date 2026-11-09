"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type AlertProps = React.ComponentPropsWithoutRef<typeof AlertRoot>

const AlertRoot = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    variant?: "destructive" | "info" | "success" | "warning"
  }
>(({ className, variant, ...props }, ref) => {
  const variants = {
    destructive: "bg-destructive text-destructive-foreground border-destructive/50",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative rounded-lg border p-4 [&>svg]:absolute [&>svg:not([class*='text-']):text-current] [&>svg]:top-4 [&>svg]:left-4 [&>svg]:h-5 [&>svg]:w-5",
        (variants as Record<string, string>)[variant ?? "default"],
        className
      )}
      {...props}
    />
  )
})

AlertRoot.displayName = "Alert"

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h5"> & { className?: string }
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p"> & { className?: string }
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export function Alert({
  variant,
  className,
  title,
  description,
  ...props
}: AlertProps & { title?: React.ReactNode; description?: React.ReactNode }) {
  return (
    <AlertRoot variant={variant} className={cn("border", className)} {...props}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {description && <AlertDescription>{description}</AlertDescription>}
    </AlertRoot>
  )
}
