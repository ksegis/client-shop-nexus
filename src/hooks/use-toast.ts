
import { useState, useCallback } from "react";
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  [key: string]: any;
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toastData = { id, ...props };
    setToasts((prev) => [...prev, toastData]);
    
    // Call sonner toast with appropriate options
    if (props.variant === "destructive") {
      sonnerToast.error(props.title, {
        description: props.description,
        ...props
      });
    } else {
      sonnerToast(props.title, {
        description: props.description,
        ...props
      });
    }
    
    return id;
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    setToasts((prev) =>
      toastId
        ? prev.filter((toast) => toast.id !== toastId)
        : []
    );
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
};

// Export a simple toast function that uses sonner directly
export const toast = (props: ToastProps) => {
  if (props.variant === "destructive") {
    return sonnerToast.error(props.title, {
      description: props.description,
      ...props
    });
  }
  return sonnerToast(props.title, {
    description: props.description,
    ...props
  });
};
