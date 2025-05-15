
import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"
// Import the toast implementation from sonner
import { toast as sonnerToast } from "sonner"

// Create a wrapper around sonner's toast that ensures type safety
const toast = ({ title, description, variant = "default", ...props }: ToastProps) => {
  return sonnerToast(title, {
    description,
    // Map variant to sonner's variant
    variant: variant === "destructive" ? "error" : "default",
    ...props,
  })
}

export { toast }
export { useToast } from "sonner"
export type { ToastProps }
