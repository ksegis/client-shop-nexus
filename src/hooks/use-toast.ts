
import { toast as sonnerToast, type ToastT } from "sonner"

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
  action?: React.ReactNode;
  [key: string]: any;
}

export function toast({ variant = "default", ...props }: ToastProps) {
  const variantClassNames = {
    default: "",
    destructive: "bg-destructive text-destructive-foreground",
    success: "bg-green-500 text-white",
  }

  return sonnerToast(props.title, {
    ...props,
    classNames: {
      toast: `${variantClassNames[variant]}`,
    },
  })
}

// Create a proper useToast hook that returns the toast function
export function useToast() {
  return {
    toast,
  }
}
