
// Re-export from sonner with proper typings
import { toast as sonnerToast, type Toast, type ToastT } from "sonner";

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

export { useToast } from "sonner";
