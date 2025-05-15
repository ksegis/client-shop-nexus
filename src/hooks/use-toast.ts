
import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"
// Import the toast implementation from sonner
import { toast as sonnerToast } from "sonner"

// Create a wrapper around sonner's toast that ensures type safety
const toast = ({ title, description, variant = "default", ...props }: ToastProps) => {
  return sonnerToast(title as string, {
    description,
    // Map variant to sonner's variant without using the 'variant' prop directly
    // as it's not recognized in ExternalToast
    ...(variant === "destructive" ? { style: { color: "red" } } : {}),
    ...props,
  })
}

// Export a simple useToast hook since sonner doesn't export one directly
const useToast = () => {
  return { toast }
}

export { toast, useToast }
export type { ToastProps }
