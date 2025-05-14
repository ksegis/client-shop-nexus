
// Implementation for toast functionality
import { toast as sonnerToast, type ToastT } from "sonner";

type ToastProps = Omit<ToastT, "id"> & {
  title?: string;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
};

export function toast({ title, description, variant, ...props }: ToastProps) {
  return sonnerToast(title as string, {
    ...props,
    description,
    className: variant === "destructive" ? "destructive" : undefined,
  });
}

// Create our own useToast hook since sonner doesn't export one
export function useToast() {
  return {
    toast,
  };
}
