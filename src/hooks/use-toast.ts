
import { toast as sonnerToast, type ToastOptions as SonnerToastOptions } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  id?: string;
}

export function toast({
  title,
  description,
  variant,
  ...props
}: ToastProps & Omit<SonnerToastOptions, "className">) {
  return sonnerToast(title, {
    description,
    className: variant === "destructive" ? "destructive" : undefined,
    ...props,
  });
}

export function useToast() {
  return {
    toast,
  };
}
