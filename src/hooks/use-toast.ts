
import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  id?: string;
}

// Define our own ToastOptions type instead of importing from sonner
type ToastOptions = {
  description?: string;
  action?: React.ReactNode;
  id?: string;
  duration?: number;
  className?: string;
  [key: string]: any;
};

export function toast({
  title,
  description,
  variant,
  ...props
}: ToastProps & Omit<ToastOptions, "className">) {
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
